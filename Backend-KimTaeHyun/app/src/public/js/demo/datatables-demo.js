
// Call the dataTables jQuery plugin
$('#dataTable').DataTable().destroy();
function startTable() {
  let sid = "B101010"
  let rid = "123"
  console.log(sid,rid);
  $('#dataTable').DataTable(
    {
    ajax: "/ajax-api?sid="+sid+"&rid="+rid,    
columns:[
      {data:"address"},
      {data:"time"}
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
