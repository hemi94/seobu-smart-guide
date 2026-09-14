
const D = window.SEOBU_DATA;
const views = [...document.querySelectorAll('.view')];
const navBtns = [...document.querySelectorAll('.nav-btn')];
let activeCategory = '전체';

function go(id){
  views.forEach(v=>v.classList.toggle('active',v.id===id));
  navBtns.forEach(b=>b.classList.toggle('active',b.dataset.go===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

function esc(v=''){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function phoneHref(p){
  if(!p) return null;
  const s=String(p);
  if(!/^0\d{1,2}-\d{3,4}-\d{4}$/.test(s)) return null;
  return 'tel:'+s.replace(/-/g,'');
}
function serviceText(s){
  return [s['대분류'],s['민원인이 찾을 말'],s['검색 키워드'],s['담당부서'],s['담당팀'],s['주요업무'],s['AI 검색용 문장'],s['비고']].filter(Boolean).join(' ').toLowerCase();
}
function tokens(q){return String(q||'').toLowerCase().replace(/[?!.,/()[\]·]/g,' ').split(/\s+/).filter(x=>x.length>=2)}

function renderServiceCard(s){
  const p1=phoneHref(s['외부전화1']), p2=phoneHref(s['외부전화2']);
  const note = (!p1 && s['외부전화1']) || (!p2 && s['외부전화2']) ? `<div class="note">일부 연락처는 바로 전화 연결 형식이 아니므로 게시 전 확인이 필요합니다.</div>` : '';
  return `<article class="service-card">
    <span class="tag">${esc(s['대분류'])}</span>
    <h3>${esc(s['민원인이 찾을 말'])}</h3>
    <div class="dept">${esc(s['담당부서'])}${s['담당팀'] ? ' · '+esc(s['담당팀']) : ''}</div>
    <div class="detail">${esc(s['주요업무'])}</div>
    <div class="meta">
      ${s['위치']?`<span>📍 ${esc(s['위치'])}</span>`:''}
      ${s['외부전화1']?`<span>☎ ${esc(s['외부전화1'])}</span>`:''}
      ${s['외부전화2']?`<span>☎ ${esc(s['외부전화2'])}</span>`:''}
    </div>
    <div class="actions">
      ${p1?`<a class="call-btn" href="${p1}">☎ 전화하기</a>`:''}
      ${p2?`<a class="outline-btn" href="${p2}">☎ 두 번째 번호</a>`:''}
    </div>${note}
  </article>`;
}

const categories=['전체',...new Set(D.services.map(x=>x['대분류']).filter(Boolean))];
const chips=document.getElementById('categoryChips');

let categoryExpanded = false;

function renderCategoryChips(){
  const mainCategories = categories.slice(0,4);
  const hiddenCategories = categories.slice(4);

  const visibleCategories = categoryExpanded
    ? categories
    : mainCategories;

  chips.innerHTML =
    visibleCategories.map(c=>
      `<button class="chip ${c===activeCategory?'active':''}" data-cat="${esc(c)}">
        ${esc(c)}
      </button>`
    ).join('')
    +
    (hiddenCategories.length
      ? `<button class="chip more-chip" id="categoryMoreBtn">
          ${categoryExpanded ? '접기 ▲' : '더보기 ▼'}
        </button>`
      : '');

  chips.querySelectorAll('[data-cat]').forEach(b=>{
    b.addEventListener('click',()=>{
      activeCategory=b.dataset.cat;
      renderCategoryChips();
      renderServices();
    });
  });

  const moreBtn=document.getElementById('categoryMoreBtn');

  if(moreBtn){
    moreBtn.addEventListener('click',()=>{
      categoryExpanded=!categoryExpanded;
      renderCategoryChips();
    });
  }
}

renderCategoryChips();

function renderServices(){
  const q=document.getElementById('serviceSearch').value.trim().toLowerCase();
  let list=D.services.filter(s=>(activeCategory==='전체'||s['대분류']===activeCategory) && (!q||serviceText(s).includes(q)));
  document.getElementById('serviceCount').textContent=`${list.length}건`;
  document.getElementById('serviceResults').innerHTML=list.length?list.map(renderServiceCard).join(''):`<div class="empty">검색 결과가 없습니다.<br>다른 표현으로 검색해 주세요.</div>`;
}
document.getElementById('serviceSearch').addEventListener('input',renderServices);
renderServices();

function floorOrder(name){
  const map={'지하1층':0,'1층':1,'2층':2,'3층':3,'4층':4};
  return map[name] ?? 99;
}
function renderFloors(){
  const groups = {};

  D.floors.forEach(x => {
    if (x['층'] && x['공간']) {
      (groups[x['층']] ??= []).push(x);
    }
  });

  document.getElementById('floorResults').innerHTML =
    Object.keys(groups)
      .sort((a,b) => floorOrder(a) - floorOrder(b))
      .map(f => {

        const rows = groups[f].map(x => {
          const phone = phoneHref(x['대표전화']);

          return `
            <div class="floor-dept-row">
              <div class="floor-dept-name">${esc(x['공간'])}</div>

              <div class="floor-dept-contact">
                ${
                  x['대표전화']
                    ? phone
                      ? `<a class="floor-phone" href="${phone}">
                           ☎ ${esc(x['대표전화'])}
                         </a>`
                      : `<span class="floor-phone">
                           ☎ ${esc(x['대표전화'])}
                         </span>`
                    : ''
                }

                ${
                  x['팩스']
                    ? `<span class="floor-fax">
                         팩스 ${esc(x['팩스'])}
                       </span>`
                    : ''
                }
              </div>
            </div>
          `;
        }).join('');

        return `
          <section class="floor-card">
            <div class="floor-label">${esc(f)}</div>
            <div class="floor-content">
              ${rows}
            </div>
          </section>
        `;
      })
      .join('');
}
renderFloors();

function renderContacts(){
  const q = document.getElementById('contactSearch').value.trim().toLowerCase();

  const list = D.contacts.filter(x => {
    const t = [
      x['부서/공간'],
      x['직위·팀'],
      x['외부전화1'],
      x['외부전화2'],
      x['팩스'],
      x['위치/안내'],
      x['비고']
    ].filter(Boolean).join(' ').toLowerCase();

    return !q || t.includes(q);
  });

  document.getElementById('contactResults').innerHTML = list.length
    ? list.map(x => {

        const p1 = phoneHref(x['외부전화1']);
        const p2 = phoneHref(x['외부전화2']);

        const name = x['부서/공간'] || '';
        const isMain = name === '대표' || name === '민원실';

        return `
          <article class="contact-card ${isMain ? 'contact-main' : ''}">

            <div class="contact-card-top">
              <div>
                ${isMain ? '<span class="contact-badge">주요 연락처</span>' : ''}
                <h3>${esc(name === '대표' ? '대표전화' : name)}</h3>

                ${
                  x['직위·팀'] && x['직위·팀'] !== '대표전화'
                    ? `<div class="contact-sub">${esc(x['직위·팀'])}</div>`
                    : ''
                }
              </div>

              ${
                x['위치/안내']
                  ? `<div class="contact-location">📍 ${esc(x['위치/안내'])}</div>`
                  : ''
              }
            </div>

            <div class="contact-number-area">

              ${
                x['외부전화1']
                  ? p1
                    ? `<a class="contact-number" href="${p1}">
                         ☎ ${esc(x['외부전화1'])}
                       </a>`
                    : `<div class="contact-number contact-number-text">
                         ☎ ${esc(x['외부전화1'])}
                       </div>`
                  : ''
              }

              ${
                x['외부전화2']
                  ? p2
                    ? `<a class="contact-number contact-number-second" href="${p2}">
                         ☎ ${esc(x['외부전화2'])}
                       </a>`
                    : `<div class="contact-number contact-number-second">
                         ☎ ${esc(x['외부전화2'])}
                       </div>`
                  : ''
              }

            </div>

            ${
              x['팩스']
                ? `<div class="contact-fax">팩스 ${esc(x['팩스'])}</div>`
                : ''
            }

            ${
              x['비고']
                ? `<div class="contact-note">${esc(x['비고'])}</div>`
                : ''
            }

            ${
              p1
                ? `<div class="contact-actions">
                     <a class="contact-call-btn" href="${p1}">
                       ☎ 전화하기
                     </a>
                   </div>`
                : ''
            }

          </article>
        `;
      }).join('')
    : `<div class="empty">검색 결과가 없습니다.</div>`;
}
document.getElementById('contactSearch').addEventListener('input',renderContacts);
renderContacts();

function smartSearch(){
  const q=document.getElementById('smartSearch').value.trim();
  const tk=tokens(q);
  if(!q){document.getElementById('smartResults').innerHTML='<div class="empty">궁금한 내용을 입력해 주세요.</div>'; return}
  const scored=D.services.map(s=>{
    const t=serviceText(s);
    let score=0;
    tk.forEach(w=>{ if(t.includes(w)) score+=2; });
    if(t.includes(q.toLowerCase())) score+=5;
    // 몇 가지 흔한 표현 보정
    const aliases=[['옮기','전학'],['전학','전학'],['학원','학원'],['폭력','학교폭력'],['급여','교육급여'],['돌봄','돌봄'],['나이스','neis'],['증명','제증명'],['교권','교권']];
    aliases.forEach(([a,b])=>{if(q.includes(a)&&t.includes(b)) score+=3});
    return {s,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  document.getElementById('smartResults').innerHTML=scored.length
    ? `<div class="result-count">가장 관련 있는 안내 ${scored.length}건</div>`+scored.map(x=>renderServiceCard(x.s)).join('')
    : `<div class="empty">적합한 안내를 찾지 못했습니다.<br>업무검색에서 핵심 단어로 다시 검색해 주세요.</div>`;
}
document.getElementById('smartSearchBtn').addEventListener('click',smartSearch);
document.getElementById('homeSearchBtn').addEventListener('click',()=>{
  const q=document.getElementById('homeSearch').value;
  go('serviceView');
  document.getElementById('serviceSearch').value=q;
  activeCategory='전체';
  chips.querySelectorAll('.chip').forEach((x,i)=>x.classList.toggle('active',i===0));
  renderServices();
});

document.getElementById('homeSearch').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    document.getElementById('homeSearchBtn').click();
  }
});
/* 스마트폰 프레임 현재시간 */
function updatePhoneTime(){
  const el = document.getElementById('phoneTime');
  if(!el) return;

  const now = new Date();

  el.textContent = now.toLocaleTimeString('ko-KR',{
    hour:'2-digit',
    minute:'2-digit',
    hour12:false
  });
}

updatePhoneTime();
setInterval(updatePhoneTime, 30000);
