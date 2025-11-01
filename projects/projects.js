import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');


let data = [1, 2, 3, 4, 5, 5];
let sliceGenerator = d3.pie();
let arcData = sliceGenerator(data);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcData.forEach((d, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(idx))
})