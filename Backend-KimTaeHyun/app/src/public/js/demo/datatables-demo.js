
// Call the dataTables jQuery plugin
$('#dataTable').DataTable().destroy();
function startTable() {
  $('#dataTable').DataTable(
    {
    ajax: {
      url: "/info.json",
      type: "GET",
      data: data,
      dataSrc:function(data){
        return data;
      }
    },
    columns:[
      {data:"name"},
      {data:"age"},
      {data:"salary"}
    ],
    lengthChange: true,
    // 검색 기능 숨기기
    searching: true,
    // 정렬 기능 숨기기
    ordering: true,
    // 정보 표시 숨기기
    info: true,
    // 페이징 기능 숨기기
    paging: true}
    );
};
