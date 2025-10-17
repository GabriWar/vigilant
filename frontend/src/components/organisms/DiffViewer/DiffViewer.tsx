/**
 * DiffViewer Organism Component
 * Display content differences with syntax highlighting
 */

import React, { useMemo } from 'react';
import { Modal } from '@components/atoms/Modal/Modal';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import './DiffViewer.css';

export interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  diff: string;
  title?: string;
  oldSize?: number;
  newSize?: number;
}

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  lineNumber?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  isOpen,
  onClose,
  diff,
  title = 'Content Difference',
  oldSize,
  newSize,
}) => {
  const parsedDiff = useMemo(() => {
    const lines = diff.split('\n');
    const parsed: DiffLine[] = [];

    lines.forEach((line) => {
      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
        parsed.push({ type: 'header', content: line });
      } else if (line.startsWith('+')) {
        parsed.push({ type: 'add', content: line.substring(1) });
      } else if (line.startsWith('-')) {
        parsed.push({ type: 'remove', content: line.substring(1) });
      } else {
        parsed.push({ type: 'context', content: line });
      }
    });

    return parsed;
  }, [diff]);

  const stats = useMemo(() => {
    const additions = parsedDiff.filter((l) => l.type === 'add').length;
    const deletions = parsedDiff.filter((l) => l.type === 'remove').length;
    return { additions, deletions };
  }, [parsedDiff]);

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="diff-viewer">
        <div className="diff-viewer-stats">
          <div className="diff-viewer-stat-item">
            <Badge variant="success" size="sm">
              <Icon name="plus" size="xs" />
              {stats.additions} additions
            </Badge>
          </div>
          <div className="diff-viewer-stat-item">
            <Badge variant="error" size="sm">
              <Icon name="trash" size="xs" />
              {stats.deletions} deletions
            </Badge>
          </div>
          {oldSize !== undefined && newSize !== undefined && (
            <div className="diff-viewer-stat-item">
              <Badge variant="gray" size="sm">
                {formatBytes(oldSize)} → {formatBytes(newSize)}
              </Badge>
            </div>
          )}
        </div>

        <div className="diff-viewer-content">
          {parsedDiff.map((line, index) => (
            <div
              key={index}
              className={`diff-viewer-line diff-viewer-line-${line.type}`}
            >
              <span className="diff-viewer-line-number">{index + 1}</span>
              <span className="diff-viewer-line-content">
                {line.type === 'add' && <span className="diff-viewer-indicator">+ </span>}
                {line.type === 'remove' && <span className="diff-viewer-indicator">- </span>}
                {line.type === 'context' && <span className="diff-viewer-indicator">  </span>}
                {line.content}
              </span>
            </div>
          ))}
        </div>

        {parsedDiff.length === 0 && (
          <div className="diff-viewer-empty">
            <Icon name="info" size="lg" />
            <p>No differences to display</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
