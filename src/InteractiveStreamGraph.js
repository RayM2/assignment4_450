import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
    componentDidUpdate() {
      const chartData = this.props.csvData;
      d3.select('.svg_parent').selectAll('*').remove();
      if (!chartData || chartData.length === 0) {
        return;
      }

      const models = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
      const colors = { "GPT-4": "#e41a1c", "Gemini": "#377eb8", "PaLM-2": "#4daf4a", "Claude": "#984ea3", "LLaMA-3.1": "#ff7f00" };

      const margin = { top: 40, right: 120, bottom: 40, left: 60 };
      const width = 600 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const dates = chartData.map(d => d.Date);
      const stack = d3.stack()
        .keys(models)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetWiggle);
      const layers = stack(chartData);

      const xScale = d3.scaleTime()
        .domain(d3.extent(dates))
        .range([0, width]);
      const yExtent = [
        d3.min(layers, layer => d3.min(layer, d => d[0])),
        d3.max(layers, layer => d3.max(layer, d => d[1]))
      ];
      const yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([height, 0]);

      const area = d3.area()
        .x((d, i) => xScale(dates[i]))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveBasis);

      const svg = d3.select('.svg_parent')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      let tooltip = d3.select('#streamgraph-tooltip');
      if (tooltip.empty()) {
        tooltip = d3.select('body').append('div')
          .attr('id', 'streamgraph-tooltip')
          .style('position', 'absolute')
          .style('pointer-events', 'none')
          .style('background', '#fff')
          .style('border', '1px solid #ccc')
          .style('border-radius', '8px')
          .style('padding', '12px')
          .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
          .style('display', 'none')
          .style('z-index', 1000);
      }

      svg.selectAll('.layer')
        .data(layers)
        .enter().append('path')
        .attr('class', 'layer')
        .attr('d', area)
        .attr('fill', (d, i) => colors[models[i]])
        .attr('stroke', '#222')
        .attr('stroke-width', 1)
        .attr('opacity', 0.9)
        .on('mousemove', function(event, d) {
          const [x, y] = d3.pointer(event);
          const modelIdx = layers.indexOf(d);
          const model = models[modelIdx];
          const barData = chartData.map(row => ({
            date: row.Date,
            value: row[model]
          }));

          const miniWidth = 320, miniHeight = 180, miniMargin = {top: 30, right: 20, bottom: 50, left: 50};
          const barSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          barSvg.setAttribute('width', miniWidth);
          barSvg.setAttribute('height', miniHeight);

          const xMini = d3.scaleBand()
            .domain(barData.map(d => d3.timeFormat('%b')(d.date)))
            .range([miniMargin.left, miniWidth - miniMargin.right])
            .padding(0.3);
          const yMini = d3.scaleLinear()
            .domain([0, d3.max(barData, d => d.value)]).nice()
            .range([miniHeight - miniMargin.bottom, miniMargin.top]);

          barData.forEach((d, i) => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', xMini(d3.timeFormat('%b')(d.date)));
            rect.setAttribute('y', yMini(d.value));
            rect.setAttribute('width', xMini.bandwidth());
            rect.setAttribute('height', miniHeight - miniMargin.bottom - yMini(d.value));
            rect.setAttribute('fill', colors[model]);
            barSvg.appendChild(rect);
          });

          const xAxis = d3.axisBottom(xMini);
          const xAxisG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          xAxisG.setAttribute('transform', `translate(0,${miniHeight - miniMargin.bottom})`);
          d3.select(xAxisG).call(xAxis);
          barSvg.appendChild(xAxisG);

          const yAxis = d3.axisLeft(yMini).ticks(4);
          const yAxisG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          yAxisG.setAttribute('transform', `translate(${miniMargin.left},0)`);
          d3.select(yAxisG).call(yAxis);
          barSvg.appendChild(yAxisG);

          tooltip.html(`<strong>${model}</strong> Hashtag Usage Over Time<br/>`)
            .style('display', 'block')
            .style('left', (event.pageX + 20) + 'px')
            .style('top', (event.pageY - 10) + 'px');
          tooltip.node().appendChild(barSvg);
        })
        .on('mouseleave', function() {
          tooltip.style('display', 'none');
          tooltip.selectAll('svg').remove();
        });

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(6));
      svg.append('g')
        .call(d3.axisLeft(yScale));
    }

  render() {
    const models = ["LLaMA-3.1", "Claude", "PaLM-2", "Gemini", "GPT-4"];
    const colors = { "GPT-4": "#e41a1c", "Gemini": "#377eb8", "PaLM-2": "#4daf4a", "Claude": "#984ea3", "LLaMA-3.1": "#ff7f00" };
    return (
      <div>
        <svg style={{ width: 600, height: 500 }} className="svg_parent"></svg>
        {}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 10, marginLeft: 620, position: 'absolute' }}>
          <h4>Legend</h4>
          {models.map(model => (
            <div key={model} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, background: colors[model], display: 'inline-block', marginRight: 8, borderRadius: 3 }}></span>
              <span style={{ fontWeight: 500 }}>{model}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default InteractiveStreamGraph;
