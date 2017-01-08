/*
* @Author: NguyenChinh
*/
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

$('#list-message').on('hover','span.serverImg', function(){
	alert(11);
	//$(this).tooltip('toggle');
});
function confirmDelete(){
	if(confirm('Bạn có chắc chắn muốn xóa?')){
		return true;
	}

	return false;
}
