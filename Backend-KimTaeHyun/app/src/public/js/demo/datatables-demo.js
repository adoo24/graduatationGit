// Call the dataTables jQuery plugin
var dat;
var mydata =
            [
                {
                    "id": 0,
                    "name": "test0",
                    "price": "$0"
                },
                {
                    "id": 1,
                    "name": "test1",
                    "price": "$1"
                },
                {
                    "id": 2,
                    "name": "test2",
                    "price": "$2"
                },
                {
                    "id": 3,
                    "name": "test3",
                    "price": "$3"
                },
                {
                    "id": 4,
                    "name": "test4",
                    "price": "$4"
                },
                {
                    "id": 5,
                    "name": "test5",
                    "price": "$5"
                },
                {
                    "id": 6,
                    "name": "test6",
                    "price": "$6"
                },
                {
                    "id": 7,
                    "name": "test7",
                    "price": "$7"
                },
                {
                    "id": 8,
                    "name": "test8",
                    "price": "$8"
                },
                {
                    "id": 9,
                    "name": "test9",
                    "price": "$9"
                },
                {
                    "id": 10,
                    "name": "test10",
                    "price": "$10"
                }
            ];
function startTable() {
  $('#dataTable').DataTable().destroy();

  $('#dataTable').DataTable(
    {
    "destroy": true,
    ajax: {
      url: "/info.json",
      type: "GET",
      dataType:'json',
      success: function(data){
        {
          dat=data;
        }
      },
      error: function(error){
        console.log(error)
      }
    },
    columns:[
      {"data": "id"},
      {"data": "name"},
      {"data": "price"}
    ],
    data:mydata,
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
