console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink.classList.add('current');

// if (currentLink) {
//   // or if (currentLink !== undefined)
//   currentLink.classList.add('current');
// }

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/mayasissel/portfolio', title: 'GitHub' }
];

// Adjust base path based on environment
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                   // Local
  : "/portfolio/";

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith('http') ? BASE_PATH + url : url;

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Highlight current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in new tab
  if (a.host !== location.host) {
  a.target = "_blank";
  a.rel = "noopener noreferrer"; // (optional but recommended for security)
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

let select = document.querySelector('.color-scheme select');

function setColorScheme(value) {
  document.documentElement.style.setProperty('color-scheme', value);
  select.value = value;
}

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

select.addEventListener('input', (event) => {
  const value = event.target.value;
  setColorScheme(value);
  localStorage.colorScheme = value;
});

let form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
  event.preventDefault();

  let data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  let url = `${form.action}?${params.join("&")}`;
  location.href = url;
});
