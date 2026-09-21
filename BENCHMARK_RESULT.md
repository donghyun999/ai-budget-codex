# Benchmark Result

기준일: 2026-08-28  
기준 상태: 현재 작업 트리와 기존 `WORKLOG.md`, `ACCEPTANCE_RESULT.md`, 테스트·빌드 기록  
집계 제외: 본 문서(`BENCHMARK_RESULT.md`), `node_modules/`, `dist/`, 로컬 DB 실행 파일, UI 검증용 임시 산출물, 사용자 제공 기준 문서와 `reference/`

## 1. 실행 정보

| 항목 | 결과 | 근거/비고 |
|---|---|---|
| Agent 이름 | Codex | 현재 작업 에이전트 |
| 사용 모델 | GPT-5 기반 Codex | 개발자 지침에서 확인 가능한 범위. 정확한 배포 모델명·세부 버전은 확인 불가 |
| 작업 시작 시각 | 확인 불가 | 에이전트 실행 시작시각이 별도 로그로 보존되지 않음. 유지된 구현 파일 중 `package.json` 생성시각은 2026-08-28 09:21:54이나 실제 시작시각으로 간주하지 않음 |
| 작업 종료 시각 | 확인 불가 | 최초 구현 완료 응답 시각이 프로젝트 파일에 보존되지 않음. 이후 LAN 실행 지원 변경은 2026-08-28 09:54:00에 기록됨 |
| 총 작업시간 | 확인 불가 | 신뢰할 수 있는 시작·종료시각 쌍이 없어 추정하지 않음 |
| 사용자 개입 횟수 | 구현 단계 0회 | 최초 구현 지시부터 완료 보고까지 질문·확인 요청 없이 진행. 완료 후 서버 LAN 실행/종료 요청 2회는 구현 단계 개입 집계에서 제외 |
| 사용 권한 모드 | 파일시스템 unrestricted / danger-full-access, approval policy `never` | 주 구현 작업 환경에서 확인된 권한 설정. 별도 승인 요청 없이 로컬 작업 수행 |

## 2. 기술스택

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| Frontend | React 19, Vite 7, React Router 7 | 복잡한 신청 폼, 상세 탭, 역할별 액션과 SPA 화면 전환을 컴포넌트 단위로 구성하고 빠르게 production bundle을 생성하기 위해 선택 |
| Backend | Node.js, Express 5 | 외부 서비스 없이 로컬 단일 프로세스에서 REST API와 production 정적 파일을 함께 제공하기 위해 선택 |
| Database | SQLite | 필수 제약사항을 충족하고 별도 DB 서버 없이 파일 기반 영속성·트랜잭션·제약조건을 제공 |
| DB 접근 방식 | `better-sqlite3` 직접 SQL | ORM 없이 명시적인 스키마, CHECK/FK, 동기 트랜잭션과 계산 일관성을 단순하게 관리 |
| UI/CSS | 자체 CSS, Lucide React | 외부 디자인 시스템 없이 데스크톱 업무용 정보구조를 세밀하게 구성하고 일관된 아이콘을 제공 |
| 상태관리 | React Context + 컴포넌트 state | 전역 상태가 데모 역할·처리자·알림·설정 정도라 별도 상태관리 라이브러리 없이 충분 |
| 입력 검증 | Zod 4 | 신청 생성·수정의 필수값, 날짜, 금액, 사용개월, 장기 사용 예외 사유를 서버에서 구조적으로 검증 |
| 테스트 | Vitest, Supertest | 예산 계산 단위 테스트와 Express/SQLite 전체 업무 흐름 통합 테스트 수행 |
| 개발/실행 | Concurrently, Vite dev proxy | API와 웹 개발 서버를 하나의 명령으로 실행하고 `/api` 요청을 로컬 Express로 전달 |
| 기타 | PowerShell Open XML 분석 도구 | 전용 spreadsheet 런타임 오류 시 원본 XLSX를 수정하지 않고 시트·수식·업무 규칙을 읽기 위해 사용 |

## 3. 프로젝트 규모

### Git 및 라인 집계

- `git status`: 추적 파일 `.gitignore`, `README.md` 수정. 구현 소스·테스트·문서는 신규 미추적 파일 상태다.
- `git diff --stat`: 추적 파일 2개, 132 insertions, 2 deletions.
- `git diff --numstat`: `.gitignore` +6/−0, `README.md` +126/−2.
- 신규 구현 산출물: 30개.
- 수정 파일: 2개.
- 총 생성/수정 파일: **32개**. 본 벤치마크 문서는 제외했다.
- 전체 추가 라인: **7,120줄**. 신규 파일 6,988줄 + 추적 파일 추가 132줄이며 `package-lock.json`, 구현 문서, 설정을 포함한다.
- 전체 삭제 라인: **2줄**.
- 소스·테스트·설정: **26개 파일, 2,031줄**. lockfile, 구현 문서, XLSX 분석 도구를 제외한 별도 집계다.
- XLSX 분석 도구 포함 소스성 파일: 27개, 2,116줄.

신규 파일이 Git index에 등록되지 않아 일반 `git diff --numstat`만으로는 신규 파일 라인이 표시되지 않는다. 따라서 신규 산출물은 현재 파일의 실제 줄 수를 합산하고, 추적 파일은 `git diff --numstat` 값을 사용했다.

### 주요 생성/수정 파일

- 루트: `package.json`, `package-lock.json`, `vite.config.js`, `index.html`
- 프런트엔드: `src/App.jsx`, `src/components/Layout.jsx`, `src/components/ActionPanel.jsx`, `src/pages/*`, `src/styles.css`
- 백엔드: `server/app.js`, `server/database.js`, `server/repository.js`, `server/calculations.js`, `server/validation.js`, `server/seed.js`
- 테스트: `tests/calculations.test.js`, `tests/api-flow.test.js`
- 문서: `README.md`, `WORKLOG.md`, `ACCEPTANCE_RESULT.md`
- 분석 도구: `tools/inspect-xlsx.ps1`
- 수정 파일: `.gitignore`, `README.md`

### 주요 디렉터리 구조

```text
server/       Express API, SQLite 스키마, 저장소, 계산, seed
src/          React 앱, 공통 컴포넌트, 페이지, CSS
tests/        계산 단위 테스트와 API/SQLite 흐름 테스트
tools/        reference XLSX 읽기 전용 분석 도구
reference/    사용자 제공 원본 Excel
data/         로컬 SQLite 실행 데이터(Git 제외)
dist/         Vite production build 결과(Git 제외)
```

### SQLite 규모

- 업무 테이블: **4개** (`applications`, `application_users`, `workflow_history`, `pricing_plans`).
- SQLite 내부 `sqlite_sequence`은 업무 테이블 수에서 제외했다.

## 4. 구현 결과

### 신청 및 예산 산정

- 신규 신청서 작성, 부서장 승인 전 수정, 목록·상세 조회.
- 신청부서, 일자, 신청자, 부서장, 사용기간, 예산 구분·계정, 결제수단 저장.
- 목적, 업무 범위, 정량 기대효과, 기존 요금제 한계 저장.
- 한 신청서에 복수 사용자 행과 사용자별 복수 도구 표현.
- 월 단가·개월 입력 시 소요액, 개인지원 차감액, 추가 소요액과 전체 합계 자동 계산.
- reference의 8개 AI 요금제와 실제 결제 예상액 주의문 제공.

### 승인 및 사후관리

- 사용계획부터 정산·반납까지 9단계 stepper와 현재 위치 표시.
- 부서장 업무 필요성·인원 적정성 확인.
- PI팀 정기/긴급 접수, 3개 검토 기준과 의견·검토자·검토일 기록.
- 경영기획팀 3개 심사 기준과 의견·심사자·심사일 기록.
- 최종 승인/조건부 승인/반려 및 반려 후 집행 차단.
- 구독 상태, 법인카드 전표 참조, 월 사용량, 결제내역 관리.
- 산출물, 활용실적, 절감효과, 계속사용 여부의 실적보고.
- 요금제 하향, 구독 해지, 잔여예산 반납과 정산 완료.
- 단계·처리자·결정·의견·시각을 처리 이력으로 조회.

### 사용 편의 및 운영

- 신청 목록 상태 필터와 신청번호·부서·신청자·목적 검색.
- 개인정보를 사용하지 않는 현실적 데모 신청 3건 자동 seed.
- 인증 없이 신청자/부서장/PI팀/경영기획팀/최종 승인자 역할 전환.
- localhost 전용 실행과 `start:lan` LAN 바인딩 모드를 분리.

필수 요구사항 중 미구현으로 판정된 기능은 없다. 실제 영수증 파일 업로드는 요구사항이 기술 판단에 맡긴 선택 기능이므로 구현하지 않고 전표번호 또는 내부 보관 위치를 텍스트로 기록한다.

## 5. 요구사항 충족 결과

`ACCEPTANCE_RESULT.md`의 실제 판정 행을 정규식으로 다시 집계했다.

| 구분 | 총 개수 | PASS | FAIL | 미검증 |
|---|---:|---:|---:|---:|
| FR | 26 | 26 | 0 | 0 |
| BR | 18 | 18 | 0 | 0 |
| NFR | 15 | 15 | 0 | 0 |
| 전체 | **59** | **59** | **0** | **0** |

전체 충족률: **100%** (`59 PASS ÷ 59 검증 항목 × 100`).

## 6. 빌드·실행·테스트

| 항목 | 결과 | 근거 |
|---|---|---|
| 의존성 설치 | PASS | `npm install`: 286 packages 추가, 287 packages audit, 취약점 0건 |
| 빌드 | PASS | `npm run build`: Vite 7.3.6, 1,690 modules transformed, production bundle 생성 |
| 실행 | PASS | `npm start`와 `npm run start:lan` 실행 확인. `/api/health` HTTP 200 및 `{"ok":true,"database":"sqlite"}` 응답 |
| 현재 서버 상태 | 중지 | 사용자의 후속 요청에 따라 3001 포트 서버를 정상 종료한 상태. 실행 검증 결과와 별개 |
| 테스트 | PASS | Vitest: 2 test files, 8 tests 전체 통과 |
| SQLite 저장/조회 | PASS | 파일 DB 저장 후 연결 종료·재연결 시 신청값, 계산합계, 처리상태 유지 확인 |
| 핵심 사용자 흐름 | PASS | 생성→수정→부서장→PI 접수/검토→예산 심사→승인/조건부 승인/반려→집행→실적→정산 검증 |
| 예산 계산 | PASS | 정상 2인 합계 420,000/200,000/220,000원, 한도 미만 경계 추가 소요액 0원, 잘못된 값 거부 |
| UI 렌더링 | PASS | Chrome 1280×1000에서 대시보드, 목록, 신규 신청, 상세, 요금제 5개 화면 렌더링 확인 |

## 7. SQLite 데이터 모델

| 테이블 | 역할 | 주요 데이터 |
|---|---|---|
| `applications` | 신청과 현재 업무 상태의 중심 엔터티 | 신청 개요, 목적·효과, stage/status, 금액 합계, PI/예산/최종결정, 집행, 실적, 정산 |
| `application_users` | 사용자 1인 단위 예산 산정 | 도구·요금제, 월 단가, 개월, 소요액, 차감액, 추가 소요액, 비고 |
| `workflow_history` | 불변 처리 감사 이력 | 단계, action type, 역할, 처리자, 결과, 의견, JSON 상세값, 처리시각 |
| `pricing_plans` | reference 요금제 참고 데이터 | 도구, 요금제, 월/연 참고단가, 권장 대상·비고 |

주요 관계:

- `applications 1:N application_users` — 외래키, 신청 삭제 시 사용자 행 cascade.
- `applications 1:N workflow_history` — 외래키, 신청 삭제 시 이력 cascade.
- `pricing_plans`는 신청 예산 입력을 돕는 독립 참고 테이블이다.

승인 상태는 `applications.stage`, `applications.status`와 단계별 검토·결정 열에 현재값으로 저장한다. 모든 처리 이벤트는 `workflow_history`에 별도 추가하여 누가 어느 단계에서 어떤 결정을 했는지 보존한다.

예산은 사용자 행마다 서버에서 재계산하여 세 금액을 저장하고, 신청 전체 합계를 `applications`에 함께 저장한다. 생성·수정은 SQLite 트랜잭션으로 원자 처리하며 금액 음수, 개월 범위, 단계, 예산 구분, 최종 결정에 CHECK 제약을 적용한다.

## 8. 주요 설계 특징

- 전체 아키텍처: React SPA → `/api` REST → Express service/repository → SQLite 파일.
- Production에서는 Express가 `dist/` 정적 파일과 API를 단일 3001 포트로 제공한다.
- API 구조: health/config/pricing/dashboard, 신청 CRUD, 신청별 action endpoint.
- 데이터 모델링: 신청 중심 모델에 사용자 예산과 처리 이력을 1:N으로 분리하고 참고 요금제를 독립 관리.
- 역할 처리: 외부 인증 대신 상단 역할 전환 UI와 데모 처리자 이름을 제공하되 서버에서 action별 허용 역할을 검증.
- 승인 프로세스: 현재 stage, 요구 역할, 반려/완료 terminal 상태를 서버에서 검사한 뒤 트랜잭션으로 다음 단계와 이력을 함께 저장.
- 계산 일관성: 클라이언트는 즉시 미리보기만 담당하고, 영속 값은 서버가 다시 계산.
- UI/UX: 고정 사이드바, KPI 대시보드, 역할별 큐, 상세 hero, 9단계 stepper, 업무/사후관리/이력 탭, 명시적 label.
- 반응형 설계: 1280px 데스크톱 중심이며 1180/840/600px breakpoint로 축소 대응.
- 운영 재현성: 빈 DB 자동 seed, 명시적 reset 명령, localhost/LAN 실행 분리.

## 9. 주요 오류 및 해결

| 오류 | 해결 |
|---|---|
| Spreadsheet 전용 런타임이 세션 `sandboxPolicy` 메타데이터 누락으로 시작되지 않음 | 동일 실패를 반복하지 않고 원본 XLSX를 수정하지 않는 PowerShell Open XML 읽기 도구로 전환 |
| 최초 XLSX rich text와 수식이 `System.Xml.XmlElement`로 출력됨 | 모든 `t` descendant와 수식 노드의 `InnerText`를 읽도록 수정 |
| 인앱 브라우저 제어가 동일한 세션 메타데이터 오류로 실행되지 않음 | 설치된 로컬 Chrome headless로 1280×1000 실제 렌더링 5개 화면 검증 |
| 새 신청서에서 상위 `신청 목록` 메뉴도 동시에 활성화됨 | React Router NavLink에 정확한 `end` 경로 매칭 적용 후 재렌더링 확인 |
| 최종 검증과 임시 UI 산출물 삭제를 결합한 명령이 안전 정책에 차단됨 | 삭제를 검증에서 분리하고 비파괴 빌드·health 확인을 재실행 |
| LAN 서버는 열렸으나 Public 방화벽이 BlockInbound이며 로컬 규칙 추가가 거부됨 | `0.0.0.0` LAN 바인딩과 로컬/LAN health는 검증. 방화벽은 조직 GPO/관리자 허용이 필요함을 명시하고, 후속 사용자 요청에 따라 서버 종료 |

## 10. PPT용 요약표

| 항목 | 결과 |
|---|---|
| Agent | Codex — GPT-5 기반, 정확한 세부 모델 확인 불가 |
| 주요 기술스택 | React 19 / Vite 7 / Express 5 / SQLite / better-sqlite3 / Zod / Vitest |
| 총 작업시간 | 확인 불가 |
| 사용자 개입 | 구현 단계 0회 |
| 생성/수정 파일 수 | 32개(신규 30, 수정 2; 본 문서 제외) |
| 추가 코드 라인 | 전체 +7,120줄; 소스·테스트·설정 2,031줄 |
| 삭제 코드 라인 | 2줄 |
| SQLite 테이블 수 | 업무 테이블 4개 |
| FR 충족 | 26/26 PASS |
| BR 충족 | 18/18 PASS |
| NFR 충족 | 15/15 PASS |
| 전체 충족률 | 100% (59/59) |
| 빌드 | PASS — Vite production build |
| 실행 | PASS — localhost/LAN health 200, 현재 서버는 사용자 요청으로 중지 |
| 테스트 | PASS — 2 files, 8 tests |
| 주요 특징 | 서버 재계산, SQLite 트랜잭션, 9단계 역할별 승인, 감사 이력, 업무용 UI |
| 주요 제한사항 | 실제 파일 업로드·실인증은 미구현(요구상 선택/데모 범위). LAN 외부 접속은 조직 방화벽 GPO 허용 필요 |
