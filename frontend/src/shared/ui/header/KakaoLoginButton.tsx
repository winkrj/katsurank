import { Button } from '../Button';
import { ROUTE_LOGIN } from '../../constant/route';

export function KakaoLoginButton() {
  return (
    <Button variant="primary" tag="a" href={ROUTE_LOGIN} className="flex h-full items-center px-4">
      <span className="flex items-center gap-1.5">
        <img src="/images/kakao_icon.png" alt="" className="size-5" aria-hidden />
        카카오 로그인
      </span>
    </Button>
  );
}
