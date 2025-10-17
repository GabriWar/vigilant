import React, { useState } from 'react';
import { useImages, useDeleteImage } from '@hooks/useImages';
import { ImageCard } from '@components/organisms/ImageCard/ImageCard';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Card } from '@components/atoms/Card/Card';
import { Icon } from '@components/atoms/Icon/Icon';
import { Button } from '@components/atoms/Button/Button';
import { AlertModal, ConfirmModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import { Image } from '@types/image';
import './ImagesPage.css';

export const ImagesPage: React.FC = () => {
  const { data: images, isLoading, error } = useImages();
  const deleteImage = useDeleteImage();
  const { showAlert, showConfirm, hideAlert, hideConfirm, handleConfirm, alertModal, confirmModal } = useModal();
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const handleDelete = (image: Image) => {
    setSelectedImage(image);
    showConfirm(
      {
        title: 'Delete Image',
        message: `Are you sure you want to delete "${image.filename}"? This action cannot be undone.`,
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      },
      async () => {
        try {
          await deleteImage.mutateAsync(image.id);
          setSelectedImage(null);
        } catch (error) {
          console.error('Error deleting image:', error);
          showAlert({
            title: 'Error',
            message: 'Failed to delete image',
            type: 'error'
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="images-page">
        <div className="images-page-header">
          <h1>Images</h1>
          <p>All images downloaded from monitored webpages</p>
        </div>
        <div className="images-page-loading">
          <Spinner size="lg" />
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="images-page">
        <div className="images-page-header">
          <h1>Images</h1>
          <p>All images downloaded from monitored webpages</p>
        </div>
        <Card className="images-page-error">
          <p>Error loading images: {error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="images-page">
      <div className="images-page-header">
        <h1>Images</h1>
        <p>All images downloaded from monitored webpages</p>
        <div className="images-page-stats">
          <span className="images-count">{images?.length || 0} images</span>
        </div>
      </div>

           {!images || images.length === 0 ? (
             <Card className="images-page-empty">
               <div className="images-empty-content">
                 <Icon name="image" size="xl" />
                 <h3>No images found</h3>
                 <p>Images will appear here when monitors download them from webpages.</p>
               </div>
             </Card>
           ) : (
             <div className="images-grid">
               {images.map((image) => (
                 <ImageCard 
                   key={image.id} 
                   image={image} 
                   onDelete={handleDelete}
                 />
               ))}
             </div>
           )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={hideConfirm}
        onConfirm={handleConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        type={confirmModal.options.type}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};