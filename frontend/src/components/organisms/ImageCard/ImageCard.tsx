import React, { useState } from 'react';
import { Image } from '@types/image';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './ImageCard.css';

interface ImageCardProps {
  image: Image;
  onDelete?: (image: Image) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(image);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="image-card">
      <div className="image-card-header">
        <div className="image-card-title">
          <h3>{image.filename}</h3>
          <span className="image-card-monitor">Monitor #{image.monitor_id}</span>
        </div>
        <div className="image-card-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullImage(true)}
            title="View full image"
          >
            <Icon name="eye" size="sm" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              title="Delete image"
              className="image-card-delete"
            >
              <Icon name="trash" size="sm" />
            </Button>
          )}
        </div>
      </div>

      <div className="image-card-content">
        <div className="image-card-preview">
          {imageError ? (
            <div className="image-card-error">
              <Icon name="image" size="lg" />
              <p>Failed to load image</p>
            </div>
          ) : (
            <img
              src={`/api/images/${image.id}/download`}
              alt={image.filename}
              onError={handleImageError}
              loading="lazy"
            />
          )}
        </div>

        <div className="image-card-details">
          <div className="image-card-meta">
            <div className="image-card-meta-item">
              <Icon name="calendar" size="sm" />
              <span>
                Downloaded {formatDistanceToNow(new Date(image.downloaded_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
            {image.file_size && (
              <div className="image-card-meta-item">
                <Icon name="file" size="sm" />
                <span>{formatFileSize(image.file_size)}</span>
              </div>
            )}
            {image.width && image.height && (
              <div className="image-card-meta-item">
                <Icon name="maximize" size="sm" />
                <span>{image.width} × {image.height}</span>
              </div>
            )}
            {image.mime_type && (
              <div className="image-card-meta-item">
                <Icon name="tag" size="sm" />
                <span>{image.mime_type}</span>
              </div>
            )}
          </div>

          {image.original_url && (
            <div className="image-card-url">
              <a
                href={image.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="image-card-link"
              >
                <Icon name="external-link" size="sm" />
                View original
              </a>
            </div>
          )}
        </div>
      </div>

      {showFullImage && (
        <div className="image-card-modal" onClick={() => setShowFullImage(false)}>
          <div className="image-card-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="image-card-modal-close"
              onClick={() => setShowFullImage(false)}
            >
              <Icon name="x" size="md" />
            </button>
            <img
              src={`/api/images/${image.id}/download`}
              alt={image.filename}
              className="image-card-modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};