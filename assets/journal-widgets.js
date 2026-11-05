(() => {
  'use strict';
  const flow = document.querySelector('[data-journal-widget="flow"]');
  if (flow) {
    const cases = {
      student: {
        steps: ["students/fb-101 문서 조회", "lessons에서 studentId = fb-101 조건으로 수업 조회", "조회 결과를 앱 또는 서버 코드에서 결합"],
        sql: "SELECT s.name, l.starts_at, l.status\nFROM students AS s\nJOIN lessons AS l\n  ON l.student_id = s.id\nWHERE s.id = 'u-101';",
        result: "조회 결과 예시: 학생 한 명의 이름과 예약 수업 목록을 함께 표시합니다."
      },
      right: {
        steps: ["students/fb-101 문서 조회", "lessons에서 학생의 취소 수업 목록 조회", "lesson_rights 관련 문서 조회", "학기·선생님 배정 이력 등 필요한 관계를 코드에서 결합"],
        sql: "SELECT l.starts_at, l.status,\n       r.status AS right_status\nFROM lessons AS l\nJOIN lesson_rights AS r\n  ON r.source_lesson_id = l.id\nWHERE l.student_id = 'u-101'\n  AND l.status = 'canceled';",
        result: "조회 결과 예시: 취소 수업과 그 수업에 연결된 수강권의 상태를 함께 확인합니다."
      }
    };
    const docs = flow.querySelector('[data-flow-docs]');
    const sql = flow.querySelector('[data-flow-sql]');
    const out = flow.querySelector('[data-flow-out]');
    const buttons = [...flow.querySelectorAll('[data-flow-case]')];
    function render(key) {
      const data = cases[key]; if (!data) return;
      docs.replaceChildren(...data.steps.map(step => { const li = document.createElement('li'); li.textContent = step; return li; }));
      sql.textContent = data.sql;
      out.textContent = data.result;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.flowCase === key)));
    }
    buttons.forEach(button => button.addEventListener('click', () => render(button.dataset.flowCase)));
    render('student');
  }

  const validation = document.querySelector('[data-journal-widget="validation"]');
  if (validation) {
    const studentCell = validation.querySelector('[data-bad-student]');
    const rightCell = validation.querySelector('[data-bad-right]');
    const report = validation.querySelector('[data-validation-report]');
    const validate = validation.querySelector('[data-validate]');
    const repair = validation.querySelector('[data-repair]');
    const reset = validation.querySelector('[data-reset]');
    let fixed = false;
    const show = (message, result) => { report.textContent = message; report.dataset.result = result || ''; };
    const paint = () => {
      studentCell.textContent = fixed ? 'u-102' : 'u-999';
      rightCell.textContent = fixed ? '반환' : '사용';
      [studentCell,rightCell].forEach(el => { el.classList.toggle('jw-bad', !fixed); el.classList.toggle('jw-fixed', fixed); });
    };
    validate.addEventListener('click', () => {
      if (fixed) {
        show('검증 통과: 원본 식별자 매핑, 수업 참조, 수강권 상태가 모두 일치합니다.\n수량 일치만으로는 알 수 없던 데이터의 의미까지 확인했습니다.', 'ok');
      } else {
        show('오류 2건 발견\n① L-02의 student_id = u-999: 원본 fb-102의 매핑값 u-102와 불일치\n② L-02의 수강권 상태 = 사용: 원본의 반환 상태와 불일치', 'error');
        repair.disabled = false;
      }
    });
    repair.addEventListener('click', () => {
      fixed = true;
      paint();
      repair.disabled = true;
      show('매핑과 수강권 상태를 보정했습니다. 다시 「정합성 검증」을 눌러 확인해 보세요.', '');
    });
    reset.addEventListener('click', () => {
      fixed = false; paint(); repair.disabled = true;
      show('수량 검사만으로는 두 테이블 모두 2건이어서 문제가 드러나지 않습니다.', '');
    });
    // Initial cells represent an intentionally erroneous migration example.
    paint();
  }
})();