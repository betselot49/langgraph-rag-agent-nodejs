import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Generate a mocked Chart.js configuration based on input parameters
 * @param {Object} params - Chart configuration parameters
 * @param {string} params.chartType - Type of chart (bar, line, pie, doughnut, radar)
 * @param {Array} params.labels - Labels for the chart
 * @param {Array} params.data - Data values for the chart
 * @param {string} params.title - Chart title
 * @returns {Object} Chart.js configuration object
 */
function generateChartConfig({ chartType, labels, data, title }) {
  const chartColors = [
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
  ];

  const baseConfig = {
    type: chartType || 'bar',
    data: {
      labels: labels || ['Label 1', 'Label 2', 'Label 3'],
      datasets: [
        {
          label: title || 'Dataset',
          data: data || [12, 19, 3],
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: title || 'Chart Title',
        },
      },
    },
  };

  // Add specific options based on chart type
  if (chartType === 'line') {
    baseConfig.data.datasets[0].tension = 0.4;
    baseConfig.data.datasets[0].fill = false;
  }

  if (chartType === 'bar' || chartType === 'line') {
    baseConfig.options.scales = {
      y: {
        beginAtZero: true,
      },
    };
  }

  return baseConfig;
}

/**
 * Create the Chart.js tool for LangGraph
 * This tool can be called by the delegating agent to generate chart configurations
 */
export const chartJSTool = new DynamicStructuredTool({
  name: 'generate_chart',
  description: `Generate a Chart.js configuration for data visualization. 
  Use this tool when the user asks to create a chart, graph, or visualize data.
  Supported chart types: bar, line, pie, doughnut, radar.
  Returns a complete Chart.js configuration object that can be used to render a chart.`,
  schema: z.object({
    chartType: z
      .enum(['bar', 'line', 'pie', 'doughnut', 'radar'])
      .describe('Type of chart to generate'),
    labels: z
      .array(z.string())
      .describe('Array of labels for the chart axes or segments'),
    data: z
      .array(z.number())
      .describe('Array of numeric data values'),
    title: z
      .string()
      .describe('Title for the chart'),
  }),
  func: async ({ chartType, labels, data, title }) => {
    console.log('📊 Chart.js Tool called with:', { chartType, labels, data, title });
    
    const config = generateChartConfig({ chartType, labels, data, title });
    
    // Return as JSON string for LangGraph compatibility
    return JSON.stringify({
      success: true,
      chartConfig: config,
      message: `Generated ${chartType} chart with ${data.length} data points`,
    });
  },
});

/**
 * Mock function to directly generate chart configs (for testing)
 * @param {Object} params - Chart parameters
 * @returns {Object} Chart.js configuration
 */
export function mockGenerateChart(params) {
  return generateChartConfig(params);
}

/**
 * Test the Chart.js tool with sample data
 */
async function testChartJSTool() {
  console.log('🧪 Testing Chart.js Tool...\n');
  
  try {
    // Test 1: Bar chart
    console.log('Test 1: Generating Bar Chart');
    const barResult = await chartJSTool.invoke({
      chartType: 'bar',
      labels: ['January', 'February', 'March', 'April'],
      data: [65, 59, 80, 81],
      title: 'Monthly Sales',
    });
    console.log('✅ Bar Chart Result:', JSON.parse(barResult).message);
    
    // Test 2: Line chart
    console.log('\nTest 2: Generating Line Chart');
    const lineResult = await chartJSTool.invoke({
      chartType: 'line',
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [10, 25, 15, 30],
      title: 'Weekly Progress',
    });
    console.log('✅ Line Chart Result:', JSON.parse(lineResult).message);
    
    // Test 3: Pie chart
    console.log('\nTest 3: Generating Pie Chart');
    const pieResult = await chartJSTool.invoke({
      chartType: 'pie',
      labels: ['Red', 'Blue', 'Yellow'],
      data: [300, 50, 100],
      title: 'Color Distribution',
    });
    console.log('✅ Pie Chart Result:', JSON.parse(pieResult).message);
    
    // Test 4: Doughnut chart
    console.log('\nTest 4: Generating Doughnut Chart');
    const doughnutResult = await chartJSTool.invoke({
      chartType: 'doughnut',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      data: [25, 30, 28, 35],
      title: 'Quarterly Revenue',
    });
    console.log('✅ Doughnut Chart Result:', JSON.parse(doughnutResult).message);
    
    // Test 5: Radar chart
    console.log('\nTest 5: Generating Radar Chart');
    const radarResult = await chartJSTool.invoke({
      chartType: 'radar',
      labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency'],
      data: [85, 90, 75, 95, 80],
      title: 'Vehicle Performance',
    });
    console.log('✅ Radar Chart Result:', JSON.parse(radarResult).message);
    
    console.log('\n🎉 All Chart.js tool tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export everything
export default {
  chartJSTool,
  mockGenerateChart,
  testChartJSTool,
};

// Run test if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testChartJSTool()
    .then(() => {
      console.log('✅ Chart.js Tool is ready for integration!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

