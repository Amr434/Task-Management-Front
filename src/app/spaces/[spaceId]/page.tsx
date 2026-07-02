import React from 'react';
import { SpaceView } from '@/features/spaces/components/SpaceView';

interface SpacePageProps {
  params: Promise<{
    spaceId: string;
  }>;
}

export default async function SpacePage({ params }: SpacePageProps) {
  const resolvedParams = await params;
  const spaceId = parseInt(resolvedParams.spaceId, 10);
  
  if (isNaN(spaceId)) {
    return <div>Invalid Space ID</div>;
  }

  return (
    <div className="space-page">
      <SpaceView spaceId={spaceId} />
    </div>
  );
}
