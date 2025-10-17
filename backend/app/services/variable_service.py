"""Variable service - extract and manage variables"""
import re
import json
import uuid
import random
import string
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from loguru import logger
from app.models.variable import Variable, VariableSource, VariableExtractMethod


class VariableExtractor:
    """Service for extracting variables from responses"""

    @staticmethod
    def extract_json_path(data: Any, path: str) -> Optional[str]:
        """
        Extract value from JSON using dot notation path

        Examples:
            data.token -> data["token"]
            user.profile.email -> data["user"]["profile"]["email"]
            items[0].id -> data["items"][0]["id"]
        """
        try:
            if isinstance(data, str):
                data = json.loads(data)

            # Split path by dots, but handle array indices
            parts = re.split(r'\.(?![^\[]*\])', path)
            value = data

            for part in parts:
                # Handle array index: items[0]
                array_match = re.match(r'(\w+)\[(\d+)\]', part)
                if array_match:
                    key = array_match.group(1)
                    index = int(array_match.group(2))
                    value = value[key][index]
                else:
                    value = value[part]

            return str(value) if value is not None else None

        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as e:
            logger.warning(f"Failed to extract JSON path '{path}': {e}")
            return None

    @staticmethod
    def extract_regex(text: str, pattern: str, group: int = 1) -> Optional[str]:
        """
        Extract value using regex pattern

        Args:
            text: Text to search in
            pattern: Regex pattern
            group: Capture group to extract (default: 1)

        Examples:
            pattern: r'"token":\s*"([^"]+)"'
            pattern: r'Bearer\s+(\S+)'
        """
        try:
            match = re.search(pattern, text)
            if match:
                if group == 0:
                    return match.group(0)  # Full match
                elif len(match.groups()) >= group:
                    return match.group(group)
            return None

        except re.error as e:
            logger.warning(f"Invalid regex pattern '{pattern}': {e}")
            return None

    @staticmethod
    def extract_cookie_value(cookies: Dict[str, str], cookie_name: str) -> Optional[str]:
        """Extract cookie value by name"""
        return cookies.get(cookie_name)

    @staticmethod
    def extract_header_value(headers: Dict[str, str], header_name: str) -> Optional[str]:
        """Extract header value by name (case-insensitive)"""
        header_name_lower = header_name.lower()
        for key, value in headers.items():
            if key.lower() == header_name_lower:
                return value
        return None

    @staticmethod
    def generate_random_string(length: int = 16, format_pattern: Optional[str] = None) -> str:
        """
        Generate random string

        Args:
            length: Length of string
            format_pattern: Optional format pattern
                           'a' = lowercase letter
                           'A' = uppercase letter
                           'n' = number
                           '#' = number
                           Example: "AAA-nnn-aaa" -> "ABC-123-xyz"
        """
        if format_pattern:
            result = []
            for char in format_pattern:
                if char == 'a':
                    result.append(random.choice(string.ascii_lowercase))
                elif char == 'A':
                    result.append(random.choice(string.ascii_uppercase))
                elif char in ('n', '#'):
                    result.append(random.choice(string.digits))
                else:
                    result.append(char)
            return ''.join(result)
        else:
            # Default: alphanumeric
            chars = string.ascii_letters + string.digits
            return ''.join(random.choice(chars) for _ in range(length))

    @staticmethod
    def generate_random_number(length: int = 10, format_pattern: Optional[str] = None) -> str:
        """
        Generate random number

        Args:
            length: Number of digits
            format_pattern: Optional format (e.g., "###-###-####")
        """
        if format_pattern:
            result = []
            for char in format_pattern:
                if char == '#':
                    result.append(str(random.randint(0, 9)))
                else:
                    result.append(char)
            return ''.join(result)
        else:
            # Generate random number with specified length
            return ''.join(str(random.randint(0, 9)) for _ in range(length))

    @staticmethod
    def generate_random_uuid() -> str:
        """Generate UUID v4"""
        return str(uuid.uuid4())

    @staticmethod
    def extract_variable(
        variable: Variable,
        response_body: Optional[str] = None,
        response_headers: Optional[Dict[str, str]] = None,
        cookies: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        """
        Extract variable value based on configuration

        Args:
            variable: Variable configuration
            response_body: Response body (text or JSON)
            response_headers: Response headers dict
            cookies: Cookies dict

        Returns:
            Extracted value or None
        """
        try:
            # Static value
            if variable.source == VariableSource.STATIC:
                return variable.static_value

            # Random generation
            if variable.source == VariableSource.RANDOM:
                if variable.extract_method == VariableExtractMethod.RANDOM_STRING:
                    return VariableExtractor.generate_random_string(
                        variable.random_length or 16,
                        variable.random_format
                    )
                elif variable.extract_method == VariableExtractMethod.RANDOM_NUMBER:
                    return VariableExtractor.generate_random_number(
                        variable.random_length or 10,
                        variable.random_format
                    )
                elif variable.extract_method == VariableExtractMethod.RANDOM_UUID:
                    return VariableExtractor.generate_random_uuid()

            # Extract from response body
            if variable.source == VariableSource.RESPONSE_BODY:
                if not response_body:
                    return None

                if variable.extract_method == VariableExtractMethod.FULL_BODY:
                    return response_body

                elif variable.extract_method == VariableExtractMethod.JSON_PATH:
                    if not variable.extract_pattern:
                        return None
                    return VariableExtractor.extract_json_path(response_body, variable.extract_pattern)

                elif variable.extract_method == VariableExtractMethod.REGEX:
                    if not variable.extract_pattern:
                        return None
                    return VariableExtractor.extract_regex(response_body, variable.extract_pattern)

            # Extract from response headers
            if variable.source == VariableSource.RESPONSE_HEADER:
                if not response_headers or not variable.extract_pattern:
                    return None
                return VariableExtractor.extract_header_value(response_headers, variable.extract_pattern)

            # Extract from cookies
            if variable.source == VariableSource.COOKIE:
                if not cookies or not variable.extract_pattern:
                    return None
                return VariableExtractor.extract_cookie_value(cookies, variable.extract_pattern)

            return None

        except Exception as e:
            logger.error(f"Error extracting variable '{variable.name}': {e}")
            return None


class VariableReplacer:
    """Service for replacing variables in requests"""

    @staticmethod
    def replace_variables(text: str, variables: Dict[str, str]) -> str:
        """
        Replace [[variable_name]] placeholders with actual values

        Args:
            text: Text containing [[variable_name]] placeholders
            variables: Dictionary of variable_name -> value

        Examples:
            text: '{"token": "[[auth_token]]"}'
            variables: {"auth_token": "abc123"}
            result: '{"token": "abc123"}'
        """
        if not text:
            return text

        # Replace all [[variable_name]] with values
        pattern = r'\[\[(\w+)\]\]'

        def replacer(match):
            var_name = match.group(1)
            if var_name in variables:
                return variables[var_name]
            else:
                logger.warning(f"Variable '[[{var_name}]]' not found, leaving as-is")
                return match.group(0)  # Leave as-is if not found

        return re.sub(pattern, replacer, text)

    @staticmethod
    def find_variables(text: str) -> list[str]:
        """
        Find all [[variable_name]] placeholders in text

        Args:
            text: Text to search

        Returns:
            List of variable names found
        """
        if not text:
            return []

        pattern = r'\[\[(\w+)\]\]'
        return re.findall(pattern, text)

    @staticmethod
    def replace_in_request_data(
        request_data: Dict[str, Any],
        variables: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Replace variables in entire request data structure

        Args:
            request_data: Request data (url, headers, body)
            variables: Variable values

        Returns:
            Request data with variables replaced
        """
        result = {}

        for key, value in request_data.items():
            if isinstance(value, str):
                result[key] = VariableReplacer.replace_variables(value, variables)
            elif isinstance(value, dict):
                result[key] = VariableReplacer.replace_in_request_data(value, variables)
            elif isinstance(value, list):
                result[key] = [
                    VariableReplacer.replace_variables(item, variables) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                result[key] = value

        return result
