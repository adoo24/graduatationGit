// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

function number_format(number, decimals, dec_point, thousands_sep) {
  // *     example: number_format(1234.56, 2, ',', ' ');
  // *     return: '1 234,56'
  number = (number + '').replace(',', '').replace(' ', '');
  var n = !isFinite(+number) ? 0 : +number,
      prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
      sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
      dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
      s = '',
      toFixedFix = function(n, prec) {
        var k = Math.pow(10, prec);
        return '' + Math.round(n * k) / k;
      };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}
var ctx,myBarChart;
// Bar Chart Example
  var students;
  var scores;
var roomName,myId,myName;
window.onload=function loadRoomName(){
  myId = sessionStorage.id;
  myName = sessionStorage.name;
  document.getElementById('topName').innerText = myName;
  roomName=new URLSearchParams(location.search).get('roomName');
    start();
  
}


async function start(){
  ctx = document.getElementById("myBarChart");
  const req = {
    roomID: roomName,
  };
   console.log("fetch before");
  await fetch("/charts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req), // ܼ       ڿ     ٲٴ   ޼ҵ 
  }).then((res) => res.json())
      .then((res) => {
        if (res.success){
	  console.log(res);
          students = res["students"];
          scores = res["scores"];
        } else{
          console.log("fail");
          alert("fail");
        }
      })
      .catch((err) => {
        console.log(new Error(" ҷ          "));
      });
  myBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: students, // л 
      datasets: [{
        label: "부정점수",
        backgroundColor: "#4e73df",
        hoverBackgroundColor: "#2e59d9",
        borderColor: "#4e73df",
        data: scores, //    
      }], //     ̺      
    },
    options: {
      onClick: async function(point, event){
        if (event.length<=0) return;
        const index=event[0]['_index']
	let sid = myBarChart.config.data.labels[index]
	let rid = roomName;
	console.log(sid, rid);
	await startTable(sid,rid);
  onclicck();
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 25,
          top: 25,
          bottom: 0
        }
      },
      scales: {
        xAxes: [{
          time: {
            unit: '학생'
          },
          gridLines: {
            display: false,
            drawBorder: false
          },
          ticks: {
            maxTicksLimit: 6
          },
          maxBarThickness: 25,
        }],
        yAxes: [{
          ticks: {
            min: 0,
            max: Math.max.apply(null,scores),
            maxTicksLimit: 5,
            padding: 10,
            // Include a dollar sign in the ticks
            callback: function(value, index, values) {
              return number_format(value);
            }
          },
          gridLines: {
            color: "rgb(234, 236, 244)",
            zeroLineColor: "rgb(234, 236, 244)",
            drawBorder: false,
            borderDash: [2],
            zeroLineBorderDash: [2]
          }
        }],
      },
      legend: {
        display: false
      },
      tooltips: {
        titleMarginBottom: 10,
        titleFontColor: '#6e707e',
        titleFontSize: 14,
        backgroundColor: "rgb(255,255,255)",
        bodyFontColor: "#858796",
        borderColor: '#dddfeb',
        borderWidth: 1,
        xPadding: 15,
        yPadding: 15,
        displayColors: false,
        caretPadding: 10,
        callbacks: {
          label: function(tooltipItem, chart) {
            var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
            return datasetLabel + ':' + number_format(tooltipItem.yLabel);
          }
        }
      },
    }
  });

}


// Call the dataTables jQuery plugin


function startTable(sid , rid) {
  $('#dataTable').DataTable().destroy();
  $('#dataTable').DataTable(
    {
    ajax: "/ajax-api?sid="+sid+"&rid="+rid,    
columns:[
      {data:"time"},
      {data:"address"}
    ],
    lengthChange: true,
    // 검색 기능 숨기기
    searching: true,
    // 정렬 기능 숨기기
    ordering: true,
    // 정보 표시 숨기기
    info: true,
    // 페이징 기능 숨기기
    paging: true,
    
  }
    );
};
function onclicck(){
  $("#dataTable").on('click', 'tbody tr', function () {
    var row = $("#dataTable").DataTable().row($(this)).data();
    location.href=row['address'].substr(62);
  });
}