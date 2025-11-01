import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');


// === Step 3: Process data for pie chart ===

// Roll up projects by year and count them
let rolledData = d3.rollups(
  projects,
  (v) => v.length,   // count projects in each year
  (d) => d.year      // group by year
);

// Convert to { label, value } format for D3 pie chart
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcData.forEach((d, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(idx))
})

let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('class', 'legend-item')
    .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});