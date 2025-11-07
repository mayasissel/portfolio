import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/mayasissel/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>:');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').html('Total Commits');
  dl.append('dd').text(commits.length);

  // Number of files
  const numFiles = d3.groups(data, (d) => d.file).length;
  dl.append('dt').html('Number of Files:');
  dl.append('dd').text(numFiles);

  const fileMaxLines = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file
  );

  // Longest file (name)
  const longestFile = d3.greatest(fileMaxLines, (d) => d[1]);
  dl.append('dt').html('Longest File:');
  dl.append('dd').text(longestFile ? longestFile[0] : 'N/A');

  // Average line length (in characters)
  const avgLineLength = d3.mean(data, (d) => d.length);
  dl.append('dt').html('Average Line Length (in characters):');
  dl.append('dd').text(avgLineLength.toFixed(2));

  // Time of day with most work
  const workByPeriod = d3.rollups(
  data,
  (v) => v.length,
  (d) => {
    const hour = d.datetime.getHours();
    return hour < 6
      ? 'Night'
      : hour < 12
      ? 'Morning'
      : hour < 18
      ? 'Afternoon'
      : 'Evening';
  }
);

const maxPeriod = d3.greatest(workByPeriod, (d) => d[1]);

dl.append('dt').html('Most Active Time of Day:');
dl.append('dd').text(maxPeriod ? maxPeriod[0] : 'N/A');
}

function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => updateTooltipVisibility(false));


  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  const yTicks = yScale.ticks();

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines
  .selectAll('line')
  .data(yTicks)
  .join('line')
  .attr('x1', 0)
  .attr('x2', usableArea.width)
  .attr('y1', (d) => yScale(d))
  .attr('y2', (d) => yScale(d))
  .attr('stroke-width', 1)
  .attr('stroke', (d) => {
    // Map 0–24h to color
    const t = Math.sin((d / 24) * Math.PI);
    return d3.interpolateRgb('steelblue', 'orange')(t);
  });

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (!commit || Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleDateString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.datetime?.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });
  author.textContent = commit.author || 'Unknown';
  lines.textContent = commit.totalLines ?? 'N/A';
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 10}px`; // slight offset
  tooltip.style.top = `${event.clientY + 10}px`;
}

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);

renderScatterPlot(data, commits);