'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleVoteForPlatinum } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface UseVotePlatinumOptions {
  platinumId: string;
  ownerId: string;
  initialVotes: number;
  initialMonthlyVotes: number;
  initialHasVoted: boolean;
}

export function useVotePlatinum({
  platinumId,
  ownerId,
  initialVotes,
  initialMonthlyVotes,
  initialHasVoted,
}: UseVotePlatinumOptions) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [state, setState] = useState({
    hasVoted: initialHasVoted,
    votes: initialVotes,
    monthlyVotes: initialMonthlyVotes,
  });

  const [syncedProps, setSyncedProps] = useState({
    initialHasVoted,
    initialVotes,
    initialMonthlyVotes,
  });

  if (
    syncedProps.initialHasVoted !== initialHasVoted ||
    syncedProps.initialVotes !== initialVotes ||
    syncedProps.initialMonthlyVotes !== initialMonthlyVotes
  ) {
    setSyncedProps({ initialHasVoted, initialVotes, initialMonthlyVotes });
    setState({
      hasVoted: initialHasVoted,
      votes: initialVotes,
      monthlyVotes: initialMonthlyVotes,
    });
  }

  const isOwner = authUser?.id === ownerId;

  const toggleVote = () => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (isOwner || isPending) return;

    startTransition(async () => {
      const result = await toggleVoteForPlatinum(platinumId);

      if (!result.success) {
        toast({
          title: 'No se pudo votar',
          description: result.error,
          variant: 'danger',
        });
        router.refresh();
        return;
      }

      setState({
        hasVoted: result.hasVoted,
        votes: result.votes,
        monthlyVotes: result.monthlyVotes,
      });

      toast({
        title: result.hasVoted ? '¡Voto registrado!' : 'Voto retirado',
        description: result.hasVoted
          ? 'Tu voto se ha guardado correctamente.'
          : 'Tu voto ya no contará para el ranking de este mes.',
        variant: result.hasVoted ? 'success' : 'danger',
      });

      router.refresh();
    });
  };

  return {
    hasVoted: state.hasVoted,
    votes: state.votes,
    monthlyVotes: state.monthlyVotes,
    isPending,
    isOwner,
    toggleVote,
  };
}
