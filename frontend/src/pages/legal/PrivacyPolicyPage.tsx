import { LegalPageLayout } from './components/LegalPageLayout';

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="개인정보처리방침" effectiveDate="2026-08-01">
      <section>
        <h2>1. 수집하는 개인정보 항목</h2>
        <p>
          카츠랭(이하 "서비스")은 카카오 계정으로 로그인할 때 아래 정보만 카카오로부터 제공받습니다.
        </p>
        <ul>
          <li>카카오 고유 ID (회원 식별용)</li>
          <li>닉네임</li>
          <li>프로필 이미지</li>
        </ul>
        <p>그 외의 카카오 계정 정보(이메일, 연락처 등)는 요청하거나 수집하지 않습니다.</p>
      </section>

      <section>
        <h2>2. 개인정보 수집 방법</h2>
        <p>카카오 OAuth 로그인 과정에서 이용자의 동의를 받아 카카오로부터 제공받습니다.</p>
      </section>

      <section>
        <h2>3. 개인정보의 이용 목적</h2>
        <ul>
          <li>회원 식별 및 로그인 유지 (세션 쿠키)</li>
          <li>1인 1표 투표 원칙 적용 — 이용자별 현재 투표 가게 및 표 이동 이력 관리</li>
          <li>가게 등록·투표 등 부정 사용 방지</li>
        </ul>
      </section>

      <section>
        <h2>4. 개인정보의 보유 및 이용 기간</h2>
        <p>
          회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다. 현재 서비스 내 자체 탈퇴 기능은 준비
          중이며, 삭제를 원하는 이용자는 하단 문의처로 요청하면 지체 없이 처리합니다.
        </p>
      </section>

      <section>
        <h2>5. 개인정보의 제3자 제공</h2>
        <p>서비스는 이용자의 개인정보를 외부에 제공하지 않습니다.</p>
      </section>

      <section>
        <h2>6. 쿠키(Cookie)의 사용</h2>
        <p>
          서비스는 로그인 상태 유지 및 보안(위조 요청 방지) 목적으로만 쿠키를 사용합니다. 광고·트래킹
          목적의 쿠키는 사용하지 않습니다.
        </p>
      </section>

      <section>
        <h2>7. 이용자의 권리</h2>
        <p>
          이용자는 언제든지 본인의 개인정보 열람·정정·삭제를 요청할 수 있으며, 하단 문의처를 통해
          접수합니다.
        </p>
      </section>

      <section>
        <h2>8. 개인정보 보호책임자 및 문의처</h2>
        <p>이메일: [문의용 이메일 주소]</p>
      </section>

      <section>
        <h2>9. 고지의 의무</h2>
        <p>
          이 개인정보처리방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지를
          통해 안내합니다.
        </p>
      </section>
    </LegalPageLayout>
  );
}
