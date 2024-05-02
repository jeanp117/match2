//@ts-nocheck
import Chart from "react-apexcharts";
export const updateChart = (value, setChartData) => {
  setChartData((prev) => [
    ...prev.slice(-20),
    {
      x: new Date().getTime(),
      y: value,
    },
  ]);
};
export const GraficaBPM = ({ data, bottom, top }) => {
  const DATAPOINTS = 30;
  return (
    <Chart
      options={{
        chart: {
          type: "area",
          height: "100%",

          animations: {
            enabled: false,
            speed: 800,
          },
          sparkline: {
            enabled: true,
          },
          dropShadow: {
            enabled: true,
            enabledOnSeries: undefined,
            top: 0,
            left: 0,
            blur: 3,
            color: "#000",
            opacity: 0.35,
          },
        },
        colors: ["#3CE7EF"],
        stroke: {
          curve: "smooth",
          lineCap: "butt",
        },
        tooltip: {
          enabled: false,
        },
        yaxis: {
          min: bottom,
          max: top,
          labels: {
            show: false,
          },
        },
      }}
      series={[
        {
          name: "STOCK ABC",
          data: data,
        },
      ]}
      type="area"
      height={"100%"}
      style={
        {
          // maxHeight: "120px",
        }
      }
    />
  );
};
