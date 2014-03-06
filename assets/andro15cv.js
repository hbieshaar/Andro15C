var is_this_free_version = false;

var avirgin = true;

Hp12c_storage.prototype.save = function() {
	if (window.Portal) {
		Portal.sendCookie(H.storage.save_memory2(H.machine));
	}
};

Hp12c_storage.prototype.load = function() {
	var sserial;
	if (window.Portal) {
		sserial = "" + Portal.recvCookie();
	} else {
		sserial = "";
	}

	if (sserial.length > 0) {
		H.storage.recover_memory2(H.machine, sserial);
	}
	if (avirgin && is_this_free_version) {
		start_donate();
	}
	avirgin = false;
};

var old_dispatch = Hp12c_dispatcher.prototype.dispatch;
var old_show = Hp12c_display.prototype.show;

Hp12c_dispatcher.prototype.dispatch = function (k)
{
	if (window.Portal) {
		Portal.touchFeedback();
	}
	old_dispatch.call(H.dispatcher, k);
	if (!avirgin) {
		H.storage.save();
	}
}

Hp12c_display.prototype.show = function (s)
{
	old_show.call(H.display, s);
	if (!avirgin) {
		H.storage.save();
	}
}

function do_donate()
{
        document.getElementById("donate").style.visibility = 'visible';
}

function close_donate()
{
        document.getElementById("donate").style.visibility = 'hidden';
        window.setTimeout(do_donate, 10*60*1000);
}

function start_donate()
{
        window.setTimeout(do_donate, 15*1000);
}

H.vertical_layout = true;
H.disp_theo_width = 1477.0;
H.disp_theo_height = 2417.0;
H.disp_key_offset_x = 9.0;
H.disp_key_offset_y = 574.0;
H.disp_key_width = 189;
H.disp_key_height = 167;
H.disp_key_dist_x = 254; // 251 254
H.disp_key_dist_y = 277.6; // 262 277.6
