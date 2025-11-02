import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let selectedIndex = -1;
let query = '';

function renderPieChart(projectsGiven) {

  let Newsvg = d3.select('#projects-plot');
  Newsvg.selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  newArcs.forEach((arc, idx) => {
    Newsvg.append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .attr('class', selectedIndex === idx ? 'selected' : '')
      .on('click', () => {
      selectedIndex = selectedIndex === idx ? -1 : idx;
      
      Newsvg.selectAll('path')
        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

      d3.select('.legend')
        .selectAll('li')
        .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
        
      let filteredProjects = projectsGiven;

      if (query) {
        filteredProjects = filteredProjects.filter((project) => {
            let values = Object.values(project).join(' ').toLowerCase();
            return values.includes(query.toLowerCase());
        });
      }

      if (selectedIndex !== -1) {
        let selectedYear = newData[selectedIndex].label;
        filteredProjects = filteredProjects.filter(p => p.year === selectedYear);
      }

    projectsTitle.textContent =  `${filteredProjects.length} Projects`;

    renderProjects(filteredProjects, projectsContainer, 'h2');
    });
  });


  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
  });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  
  let filteredProjects = projects.filter((project) => {
  let values = Object.values(project).join(' ').toLowerCase();
  return values.includes(query.toLowerCase());
  });
  
  projectsTitle.textContent = `${filteredProjects.length} Projects`;
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});