import React from 'react';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { useFeedbackStore } from '@/store/feedbackStore';

export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const visible = useFeedbackStore((state) => state.visible);
  const source = useFeedbackStore((state) => state.source);
  const close = useFeedbackStore((state) => state.close);
  const submitRating = useFeedbackStore((state) => state.submitRating);

  return (
    <>
      {children}
      <FeedbackModal
        visible={visible}
        source={source}
        onClose={close}
        onSubmitted={submitRating}
      />
    </>
  );
}
