import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KAKAO_LOGIN_URL } from '../../../shared/constant/api';
import { useCreateVoteMutation } from '../../../shared/mutations/votes';
import { useMeQuery } from '../../../shared/queries/me';
import { useAuthStore } from '../../../shared/stores/authStore';
import { Button } from '../../../shared/ui/Button';
import { AlertDialog, ConfirmDialog } from '../../../shared/ui/dialog';

type RestaurantVoteConfirmButtonProps = {
  restaurantId: number
  restaurantName: string
  className?: string
  label?: string
}

export function RestaurantVoteConfirmButton({
  restaurantId,
  restaurantName,
  className,
  label = '내 인생 돈까스로 투표하기',
}: RestaurantVoteConfirmButtonProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  const { data: me } = useMeQuery(isLoggedIn);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const navigate = useNavigate();
  const { mutate: vote, isPending } = useCreateVoteMutation();

  function handleVote() {
    vote(
      { restaurantId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setSuccessOpen(true);
        },
        onError: () => {
          setConfirmOpen(false);
          setErrorOpen(true);
        },
      },
    );
  }

  const alreadyVoted = me?.currentVote?.restaurantId === restaurantId

  return (
    <>
      {!isLoggedIn ? (
        <Button tag="a" variant="primary" href={KAKAO_LOGIN_URL} className={className}>
          {label}
        </Button>
      ) : alreadyVoted ? (
        <button
          type="button"
          disabled
          className={[
            'flex h-[48px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border-2 border-[#DBBA24] bg-[#FFF4D8] text-[14px] font-black text-[#7A431D]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <CheckIcon />
          투표완료
        </button>
      ) : (
        <Button
          variant="primary"
          className={['disabled:cursor-not-allowed disabled:opacity-60', className]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
        >
          {isPending ? '투표 처리 중...' : label}
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleVote}
        title={
          <>
            {restaurantName}을
            <br />
            당신의 인생 돈까스로 선택할까요?
          </>
        }
        description="표는 언제든 옮길 수 있어요."
        confirmLabel="투표하기"
      />

      <AlertDialog
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          navigate('/me');
        }}
        title="투표가 완료되었어요!"
        description="마이페이지에서 내 표를 확인할 수 있어요."
        confirmLabel="확인"
      />

      <AlertDialog
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        title="투표에 실패했어요"
        description="잠시 후 다시 시도해 주세요."
        confirmLabel="확인"
      />
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="#D88A24" />
      <path d="M4.5 8.2l2.3 2.3 4.7-4.9" stroke="#FFF4D8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
