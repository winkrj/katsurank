import { useState } from 'react';
import { KAKAO_LOGIN_URL } from '../../../shared/constant/api';
import { useAuthStore } from '../../../shared/stores/authStore';
import { Button } from '../../../shared/ui/Button';
import { AlertDialog, ConfirmDialog } from '../../../shared/ui/dialog';

type RestaurantVoteConfirmButtonProps = {
  restaurantName: string
  className?: string
  label?: string
}

export function RestaurantVoteConfirmButton({
  restaurantName,
  className,
  label = '내 인생 돈까스로 투표하기',
}: RestaurantVoteConfirmButtonProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  function handleVote() {
    setSuccessOpen(true);
  }

  if (!isLoggedIn) {
    return (
      <Button tag="a" variant="primary" href={KAKAO_LOGIN_URL} className={className}>
        {label}
      </Button>
    )
  }

  return (
    <>
      <Button variant="primary" className={className} onClick={() => setConfirmOpen(true)}>
        {label}
      </Button>

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
        onClose={() => setSuccessOpen(false)}
        title="투표가 완료되었어요!"
        description="마이페이지에서 내 표를 확인할 수 있어요."
        confirmLabel="확인"
      />
    </>
  );
}
