# Acceptance Result

검증일: 2026-08-28

판정 기준: 실제 SQLite 통합 테스트, API 응답, production build, 1280×1000 Chrome 렌더링과 구현 화면을 함께 확인했다.

## 1. 기능 Acceptance

| ID | 결과 | 검증 방법/근거 |
|---|---|---|
| FR-001 | PASS | Chrome `/applications/new` 렌더링에서 전체 신규 신청 폼과 저장 버튼 확인, POST 통합 테스트 성공 |
| FR-002 | PASS | 신청부서·신청일·신청자·부서장·시작/종료일·예산 구분·계정·결제수단을 Zod 검증 후 SQLite 저장/조회 |
| FR-003 | PASS | 신규 폼과 DB CHECK에 판관비 추경/부서 기편성예산/임원 예산 3종 구현 |
| FR-004 | PASS | 목적·범위·정량 기대효과·기존 요금제 불가 사유 입력, 저장, 상세 조회 확인 |
| FR-005 | PASS | 시나리오 A API 테스트에서 사용자 2행 생성 및 조회 길이 2 확인 |
| FR-006 | PASS | `도구·요금제 (복수 입력)`에 `Claude Pro + Cursor Pro` 저장, 월 단가 합계 60,000원으로 사용자 단위 산정 |
| FR-007 | PASS | 클라이언트 즉시 계산 및 서버 `calculateBudget`, SQLite 계산열 저장 검증 |
| FR-008 | PASS | 신청 폼 요약과 상세에서 총 소요/차감/추가금액 표시, 시나리오 A 합계 검증 |
| FR-009 | PASS | reference 8개 요금제를 `pricing_plans`에 seed하고 `/pricing`에서 실제 결제액 주의문과 함께 렌더링 |
| FR-010 | PASS | 파일 SQLite에 신청 생성 후 DB 연결을 닫고 다시 열어 동일 값·합계·상태 조회(시나리오 D) |
| FR-011 | PASS | 기본 seed 3건, 목록에 신청번호/부서/신청자/신청일/금액/상태 렌더링 확인 |
| FR-012 | PASS | `/applications/1` Chrome 렌더링에서 전체 상세, 합계, 9단계, 현재 상태 확인 |
| FR-013 | PASS | 부서장 승인 전 PUT 수정 성공과 기대효과 변경 조회, 승인 이후 수정 API 차단 구현 |
| FR-014 | PASS | 상세 9단계 stepper와 현재 단계 강조를 1280px 렌더링에서 확인 |
| FR-015 | PASS | 업무 필요성·인원 적정성 확인을 요구하는 부서장 승인 API 통합 테스트, 3단계 전이 확인 |
| FR-016 | PASS | PI 접수 시 접수시점·긴급 여부·메모 저장, 4단계 전이 확인 |
| FR-017 | PASS | 목적 구체성/요금제 적정/중복지원 3기준과 의견·일자·검토자 저장/조회 테스트 |
| FR-018 | PASS | 예산 여력/계정 적정/추경 필요와 의견·일자·심사자 저장/조회 테스트 |
| FR-019 | PASS | 승인·조건부 승인·반려 API 및 UI 선택지 구현, 세 결정 경로 자동 테스트 |
| FR-020 | PASS | 생성·수정·승인·검토·심사의 단계/처리자/결과/의견이 `workflow_history`와 처리 이력 탭에 표시 |
| FR-021 | PASS | 구독상태, 전표 참조, 월 사용량, 결제내역, 부서 보관 원칙을 입력·저장·조회 |
| FR-022 | PASS | 산출물·활용실적·절감효과·계속사용 여부 저장 후 9단계 전이 테스트 |
| FR-023 | PASS | 해당 없음/요금제 하향/구독 해지/잔여예산 반납과 반납액·메모 관리 구현 및 해지 테스트 |
| FR-024 | PASS | 목록 상태 select와 신청번호/부서/신청자/목적 검색 API·UI 구현 |
| FR-025 | PASS | 최초 실행 시 서로 다른 단계의 현실적인 데모 신청 3건과 요금제 8건 자동 seed |
| FR-026 | PASS | 상단에서 신청자/부서장/PI팀/경영기획팀/최종 승인자 역할과 처리자 이름 전환 가능 |

## 2. 업무 규칙 Acceptance

| ID | 결과 | 검증 방법/근거 |
|---|---|---|
| BR-001 | PASS | `PERSONAL_SUPPORT_MONTHLY = 50_000`, 폼·서버 계산·안내에 동일 적용 |
| BR-002 | PASS | 150,000원 × 2개월 = 300,000원 단위 테스트 통과 |
| BR-003 | PASS | 150,000원 케이스 차감 100,000원, 30,000원 케이스 차감 60,000원 테스트 통과 |
| BR-004 | PASS | `Math.max(0, required - deduction)`과 DB 음수 CHECK, 경계 케이스 추가액 0원 확인 |
| BR-005 | PASS | 2인 합계 420,000/200,000/220,000원 테스트 통과 |
| BR-006 | PASS | 복수 도구 문자열과 합산 월 단가를 사용자 한 행에 저장·산정 |
| BR-007 | PASS | 요금제 화면과 신청 예산 영역에 환율·VAT 포함 실결제 예상액 기준 명시 |
| BR-008 | PASS | 1~2개월 원칙을 폼·요금제·정책 영역에 안내하고 기본 2개월 적용 |
| BR-009 | PASS | 연장·상향 시 재신청 약정과 실적보고 계속사용 판단 구현 |
| BR-010 | PASS | 2개월 초과 시 예외 사유 없이는 서버 저장 불가, 연간 구독 예외 원칙 안내 |
| BR-011 | PASS | 상위 요금제 상시 구독 지양 원칙을 config 정책과 요금제 화면에 표시 |
| BR-012 | PASS | PI 접수 화면에 15일 접수/익월 반영 및 긴급 별도 협의 스위치·이력 구현 |
| BR-013 | PASS | PI 검토 3기준 UI·API·DB 열과 통합 테스트 존재 |
| BR-014 | PASS | 예산 심사 3기준 UI·API·DB 열과 통합 테스트 존재 |
| BR-015 | PASS | 승인/조건부 승인/반려 3결정 UI와 각 경로 테스트 통과 |
| BR-016 | PASS | 실적보고 화면·약정·정책에 사용 종료 후 2주 이내 원칙 표시 |
| BR-017 | PASS | 월 사용량/결제내역과 전표 참조를 신청자 역할에서 기록, 필요 시 제출 원칙 표시 |
| BR-018 | PASS | 하향/해지/반납 선택, 반납액, 정산 메모와 완료 상태 구현 |

## 3. 비기능 Acceptance

| ID | 결과 | 검증 방법/근거 |
|---|---|---|
| NFR-001 | PASS | `better-sqlite3`로 `data/ai-budget.db` 생성, 신청·사용자·이력 실제 저장 및 재연결 검증 |
| NFR-002 | PASS | 외부 DB/API Key/로그인 없이 `npm start`와 핵심 API 실행, health 200 |
| NFR-003 | PASS | README에 요구 버전, 설치, 개발/production 실행, seed, 테스트 절차 작성 |
| NFR-004 | PASS | 빈 DB 자동 seed 및 `npm run seed -- --reset`으로 데모 3건 재생성 성공 |
| NFR-005 | PASS | Zod 필수값·날짜·금액·개월·장기사유 검증과 잘못된 개월 400 테스트 |
| NFR-006 | PASS | Express 오류 middleware와 400/403/404/409 JSON 응답, 잘못된 요청 후 프로세스 유지 |
| NFR-007 | PASS | 서버 재계산, SQLite CHECK/FK, 트랜잭션, 역할·단계·반려/완료 상태 방어 |
| NFR-008 | PASS | 1280×1000 Chrome에서 대시보드/목록/신청/상세/요금제 업무용 레이아웃 확인 |
| NFR-009 | PASS | 상세 hero와 KPI에 현재 상태·단계·추가 신청액, stepper에 현재 위치 표시 |
| NFR-010 | PASS | 모든 주요 input/select/textarea에 label 또는 `aria-label`, 기본 키보드 컨트롤 사용 |
| NFR-011 | PASS | `npm run build` 성공 및 `npm start` production health 200, WORKLOG 기록 |
| NFR-012 | PASS | 신청 생성→조회→부서장 승인→PI 접수/검토→예산 심사→최종결정 통합 테스트 통과 |
| NFR-013 | PASS | 시나리오 A 정상 계산과 시나리오 B 한도 미만 경계 테스트 통과 |
| NFR-014 | PASS | `rg "TODO|FIXME|mock-only"`에서 핵심 미구현 코드 없음, 모든 화면 실제 API 연결 |
| NFR-015 | PASS | `WORKLOG.md`와 본 문서가 존재하고 최종 테스트·빌드·렌더 결과와 일치 |

## 4. 최종 필수 시나리오

| 시나리오 | 결과 | 검증 방법/근거 |
|---|---|---|
| A — 작성예시 수준 신청 | PASS | Vitest: 사용자1 300,000/100,000/200,000원, 사용자2 120,000/100,000/20,000원, 합계 420,000/200,000/220,000원 |
| B — 개인지원 한도 미만 | PASS | Vitest: 30,000원 × 2개월 = 60,000원, 차감 60,000원, 추가 0원 |
| C — 승인 프로세스 | PASS | Supertest + 실제 SQLite: 생성/수정/부서장/PI 접수/PI 검토/예산 심사/조건부 승인과 이력 확인 |
| D — 영속성 | PASS | 파일 DB에 신규 저장 → 연결 종료 → 동일 파일 재연결 → 신청값·220,000원·상태 동일 확인 |

## 5. 최종 명령 결과

| 명령/검증 | 결과 |
|---|---|
| `npm install` | PASS — 286 packages, 취약점 0건 |
| `npm run seed -- --reset` | PASS — SQLite 데모 신청 3건 생성 |
| `npm test` | PASS — 2 test files, 8 tests |
| `npm run build` | PASS — Vite production bundle 생성 |
| `npm start` + `/api/health` | PASS — HTTP 200, SQLite 연결 |
| Chrome 1280×1000 렌더링 5개 화면 | PASS — 대시보드, 목록, 신규, 상세, 요금제 |

최종 판정: 모든 필수 FR/BR/NFR 및 시나리오 A~D가 PASS다.
