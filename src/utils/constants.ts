
export const colors = [
  {
    borderColor: 'rgb(123, 45, 67)',
    backgroundColor: 'rgba(123, 45, 67, 0.5)'
  },
  {
    borderColor: 'rgb(89, 145, 200)',
    backgroundColor: 'rgba(89, 145, 200, 0.5)'
  },
  {
    borderColor: 'rgb(32, 178, 90)',
    backgroundColor: 'rgba(32, 178, 90, 0.5)'
  },
  {
    borderColor: 'rgb(210, 87, 153)',
    backgroundColor: 'rgba(210, 87, 153, 0.5)'
  },
  {
    borderColor: 'rgb(64, 192, 132)',
    backgroundColor: 'rgba(64, 192, 132, 0.5)'
  },
  {
    borderColor: 'rgb(180, 120, 20)',
    backgroundColor: 'rgba(180, 120, 20, 0.5)'
  },
  {
    borderColor: 'rgb(26, 102, 186)',
    backgroundColor: 'rgba(26, 102, 186, 0.5)'
  },
  {
    borderColor: 'rgb(142, 68, 173)',
    backgroundColor: 'rgba(142, 68, 173, 0.5)'
  },
  {
    borderColor: 'rgb(255, 128, 0)',
    backgroundColor: 'rgba(255, 128, 0, 0.5)'
  },
  {
    borderColor: 'rgb(221, 75, 57)',
    backgroundColor: 'rgba(221, 75, 57, 0.5)'
  },
  {
    borderColor: 'rgb(60, 180, 75)',
    backgroundColor: 'rgba(60, 180, 75, 0.5)'
  },
  {
    borderColor: 'rgb(70, 130, 180)',
    backgroundColor: 'rgba(70, 130, 180, 0.5)'
  },
  {
    borderColor: 'rgb(0, 0, 128)',
    backgroundColor: 'rgba(0, 0, 128, 0.5)'
  },
  {
    borderColor: 'rgb(255, 215, 0)',
    backgroundColor: 'rgba(255, 215, 0, 0.5)'
  },
  {
    borderColor: 'rgb(139, 69, 19)',
    backgroundColor: 'rgba(139, 69, 19, 0.5)'
  },
  {
    borderColor: 'rgb(218, 112, 214)',
    backgroundColor: 'rgba(218, 112, 214, 0.5)'
  },
  {
    borderColor: 'rgb(0, 128, 128)',
    backgroundColor: 'rgba(0, 128, 128, 0.5)'
  },
  {
    borderColor: 'rgb(184, 134, 11)',
    backgroundColor: 'rgba(184, 134, 11, 0.5)'
  },
  {
    borderColor: 'rgb(95, 158, 160)',
    backgroundColor: 'rgba(95, 158, 160, 0.5)'
  },
  {
    borderColor: 'rgb(128, 0, 0)',
    backgroundColor: 'rgba(128, 0, 0, 0.5)'
  }
]

export const options = (dark: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      display: false,
      border: {
        color: dark ? '#EFEFEF' : '#080808'
      }
    },
    y: {
      ticks: {
        color: dark ? '#EFEFEF' : '#080808'
      },
      grid: {
        color: dark ? '#EFEFEF' : '#080808'
      },
      border: {
        color: dark ? '#EFEFEF' : '#080808'
      }
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
      color: dark ? '#EFEFEF' : '#080808',
      labels: {
        color: dark ? '#EFEFEF' : '#080808',
      }
    },
    title: {
      display: true,
      text: 'Elo history',
      color: dark ? '#EFEFEF' : '#080808'
    },
  },
})

export const graphSx = (dark: boolean) => ({
  borderColor: dark ? '#CDC1C1' : 'rgba(81, 81, 81, 1)',
  withBorderColor: dark ? '#CDC1C1' : 'rgba(81, 81, 81, 1)',
  "	.MuiDataGrid-withBorderColor": {
    borderColor: dark ? '#CDC1C1' : 'rgba(81, 81, 81, 1)'
  },
  border: 0,
})

export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

export const NODESTYLE: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid black',
  borderRadius: '10px',
  color: 'black',
  minWidth: '130px',
}
