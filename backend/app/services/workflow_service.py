"""Workflow execution service"""
import json
import time
import aiohttp
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from app.models.workflow import Workflow
from app.models.workflow_execution import WorkflowExecution
from app.models.variable import Variable
from app.models.request import Request
from app.services.variable_service import VariableExtractor, VariableReplacer


class WorkflowExecutor:
    """Service for executing workflows"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_workflow(
        self,
        workflow_id: int,
        override_variables: Optional[Dict[str, str]] = None
    ) -> WorkflowExecution:
        """
        Execute a workflow

        Args:
            workflow_id: Workflow ID to execute
            override_variables: Optional dict to override variable values

        Returns:
            WorkflowExecution instance with results
        """
        # Get workflow
        result = await self.db.execute(select(Workflow).where(Workflow.id == workflow_id))
        workflow = result.scalar_one_or_none()

        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        if not workflow.is_active:
            raise ValueError(f"Workflow {workflow_id} is not active")

        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            status="running",
            steps_total=len(workflow.steps),
            steps_completed=0,
            step_results=[],
            variables_extracted=override_variables or {}
        )
        self.db.add(execution)
        await self.db.commit()
        await self.db.refresh(execution)

        start_time = time.time()

        try:
            # Get all variables for this workflow
            variables_result = await self.db.execute(
                select(Variable).where(Variable.workflow_id == workflow_id)
            )
            workflow_variables = list(variables_result.scalars().all())

            # Initialize variable context
            variable_context = override_variables.copy() if override_variables else {}

            # Sort steps by order
            sorted_steps = sorted(workflow.steps, key=lambda s: s.get('order', 0))

            # Execute each step
            for step in sorted_steps:
                step_result = await self._execute_step(
                    step,
                    workflow_variables,
                    variable_context,
                    execution
                )

                execution.step_results.append(step_result)
                execution.steps_completed += 1

                # Update execution in DB
                await self.db.commit()

                # If step failed and not continue_on_error, stop
                if step_result['status'] == 'failed' and not step.get('continue_on_error', False):
                    execution.status = 'failed'
                    execution.error_message = step_result.get('error', 'Step failed')
                    execution.error_step = step['order']
                    break

            # Determine final status
            if execution.status == 'running':
                failed_steps = [r for r in execution.step_results if r['status'] == 'failed']
                if not failed_steps:
                    execution.status = 'success'
                elif len(failed_steps) < len(sorted_steps):
                    execution.status = 'partial'
                else:
                    execution.status = 'failed'

            # Update workflow statistics
            workflow.execution_count += 1
            workflow.last_executed_at = datetime.now(timezone.utc)
            workflow.last_execution_status = execution.status

            if execution.status == 'success':
                workflow.success_count += 1
            else:
                workflow.failure_count += 1
                workflow.last_execution_error = execution.error_message

        except Exception as e:
            logger.error(f"Workflow execution error: {e}")
            execution.status = 'failed'
            execution.error_message = str(e)
            workflow.failure_count += 1
            workflow.last_execution_error = str(e)

        finally:
            # Complete execution
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_seconds = time.time() - start_time
            execution.variables_extracted = variable_context

            await self.db.commit()
            await self.db.refresh(execution)

        return execution

    async def _execute_step(
        self,
        step: Dict[str, Any],
        workflow_variables: List[Variable],
        variable_context: Dict[str, str],
        execution: WorkflowExecution
    ) -> Dict[str, Any]:
        """
        Execute a single workflow step

        Args:
            step: Step configuration
            workflow_variables: All workflow variables
            variable_context: Current variable values
            execution: WorkflowExecution instance

        Returns:
            Step result dict
        """
        step_start = time.time()
        step_result = {
            'order': step['order'],
            'request_id': step['request_id'],
            'status': 'running',
            'response_status': None,
            'variables_extracted': {},
            'error': None,
            'duration_ms': 0
        }

        try:
            # Get request
            auth_result = await self.db.execute(
                select(Request).where(Request.id == step['request_id'])
            )
            request = auth_result.scalar_one_or_none()

            if not request:
                step_result['status'] = 'failed'
                step_result['error'] = f"Request {step['request_id']} not found"
                return step_result

            # Parse request data
            try:
                request_data = json.loads(request.request_data)
            except json.JSONDecodeError:
                step_result['status'] = 'failed'
                step_result['error'] = "Invalid request data JSON"
                return step_result

            # Replace variables in request
            request_data = VariableReplacer.replace_in_request_data(request_data, variable_context)

            # Execute HTTP request
            response_body, response_headers, cookies, status_code = await self._make_http_request(request_data)

            step_result['response_status'] = status_code

            if status_code >= 400:
                step_result['status'] = 'failed'
                step_result['error'] = f"HTTP {status_code}"
            else:
                step_result['status'] = 'success'

            # Extract variables from response
            variables_to_extract = step.get('extract_variables', [])
            for var_name in variables_to_extract:
                # Find variable definition
                variable = next((v for v in workflow_variables if v.name == var_name), None)

                if variable:
                    extracted_value = VariableExtractor.extract_variable(
                        variable,
                        response_body=response_body,
                        response_headers=response_headers,
                        cookies=cookies
                    )

                    if extracted_value:
                        # Update variable in database
                        variable.current_value = extracted_value
                        variable.last_extracted_at = datetime.now(timezone.utc)

                        # Add to context
                        variable_context[var_name] = extracted_value
                        step_result['variables_extracted'][var_name] = extracted_value

                        logger.info(f"Extracted variable '{var_name}' = '{extracted_value[:50]}...'")
                    else:
                        logger.warning(f"Failed to extract variable '{var_name}'")

        except Exception as e:
            logger.error(f"Step execution error: {e}")
            step_result['status'] = 'failed'
            step_result['error'] = str(e)

        finally:
            step_result['duration_ms'] = round((time.time() - step_start) * 1000, 2)

        return step_result

    async def _make_http_request(
        self,
        request_data: Dict[str, Any]
    ) -> tuple[str, Dict[str, str], Dict[str, str], int]:
        """
        Make HTTP request

        Args:
            request_data: Request configuration

        Returns:
            Tuple of (response_body, response_headers, cookies, status_code)
        """
        url = request_data.get('url')
        method = request_data.get('method', 'GET').upper()
        headers = request_data.get('headers', {})
        body = request_data.get('body')

        connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
        timeout = aiohttp.ClientTimeout(total=30, connect=10, sock_read=10)

        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': 'Vigilant/2.0'}
        ) as session:
            request_kwargs = {
                'url': url,
                'method': method,
                'headers': headers,
                'allow_redirects': True,
            }

            # Add body if present
            if body and method in ['POST', 'PUT', 'PATCH']:
                content_type = headers.get('content-type', '').lower()

                if 'application/json' in content_type:
                    try:
                        request_kwargs['json'] = json.loads(body) if isinstance(body, str) else body
                    except json.JSONDecodeError:
                        request_kwargs['data'] = body
                else:
                    request_kwargs['data'] = body

            async with session.request(**request_kwargs) as response:
                response_body = await response.text()
                response_headers = dict(response.headers)

                # Extract cookies
                cookies_dict = {}
                for cookie in response.cookies.values():
                    cookies_dict[cookie.key] = cookie.value

                return response_body, response_headers, cookies_dict, response.status
