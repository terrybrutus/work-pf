import React from 'react';

interface ProfileImageProps {
  canEdit?: boolean;
}

export default function ProfileImage({ canEdit }: ProfileImageProps) {
  const staticImageUrl = 'https://i.imgur.com/4NAe5Nx.png';

  return (
    <div className="w-48 h-48 mx-auto mb-8 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl bg-muted/20 flex items-center justify-center">
      <img 
        src={staticImageUrl} 
        alt="Terry Brutus" 
        className="w-full h-full object-cover object-center" 
      />
    </div>
  );
}
