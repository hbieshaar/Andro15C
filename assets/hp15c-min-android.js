/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */

"use strict";

var H = {};
H.type = "15c";
H.touch_display = false;
H.vertical_layout = false;
H.embedded = false;

H.disp_theo_width = 700.0;
H.disp_theo_height = 438.0;
H.disp_key_offset_x = 44.0;
H.disp_key_offset_y = 151.0;
H.disp_key_width = 54;
H.disp_key_height = 50;
H.disp_key_dist_x = (606.0 - 44.0) / 9;
H.disp_key_dist_y = (364.0 - 151.0) / 3;
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

H.getElem = function (id)
{
	return document.getElementById(id);
};

H.badnumber = function (res)
{
	return (isNaN(res) || ! isFinite(res));
};

H.clamp = function (res)
{
	res = res || 0; // just in case it is NaN
	res = Math.max(res, -H.value_max);
	res = Math.min(res, H.value_max);
	return res;
};

H.binary_sgn = function (val)
{
	return (val >= 0 ? 1 : -1);
};

H.cl5_round = function (val, decs)
{
	var scale = Math.pow(10, decs);
	return Math.round(Math.abs(val) * scale) / scale * H.binary_sgn(val);
};

H.trim = function (stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g, "");
};

H.zeropad = function (s, n)
{
	s = "" + s;
	while (s.length < n) {
		s = "0" + s;
	}
	return s;
};

H.i18n = function (s, comma, dp0, grouping)
{
	// dp0 means: add decimal point after a whole number

	if (! grouping) {
		grouping = 3;
	}

	var dpos = s.indexOf('.');

	if (dpos == -1 && dp0) {
		s += ".";
		dpos = s.length - 1;
	}

	if (dpos != -1 && comma) {
		s = s.slice(0, dpos) + ',' + s.slice(dpos + 1);
	}

	if (dpos == -1) {
		// phantom position to satisfy loop ahead
		dpos = s.length;
	}

	var ts = comma ? "." : ",";

	var dstop = 0;
	while (dstop < s.length && isNaN(parseInt(s.charAt(dstop), 16))) {
		++dstop;
	}

	for (var e = dpos - grouping; e > dstop; e -= grouping) {
		s = s.slice(0, e) + ts + s.slice(e);
	}

	return s;
};

H.tzoffset = function (d)
{
	// returns the time zone offset, expressed as "hours *behind* UTC".
	// that would be 180 minutes for Brazil (-0300) and -60 minutes for Germany (+0100)
	return d.getTimezoneOffset() * 60000;
};

H.date_check = function (year, month, day)
{
	var daymax = 31;
	if (month == 4 || month == 6 || month == 9 || month == 11) {
		daymax = 30;
	} else if (month == 2) {
		daymax = 28;
		if ((year % 4) === 0 && (((year % 100) !== 0) || ((year % 400) === 0))) {
			// leap: divisible by 4 and not ending with 00
			//       years ending in 00 but divisible by 400 are leap!
			daymax = 29;
		}
	}
	if (day <= 0 || day > daymax || year <= 0 || year > 9999 || month <= 0 || month > 12) {
		return 0;
	}
	return 1;
};

H.date_interpret = function (n, dmy)
{
	n = Math.round(Math.abs(n) * 1000000);
	var day = Math.round(n / 1000000) % 100;
	var month = Math.round(n / 10000) % 100;
	var year = Math.round(n % 10000);

	if (! dmy) {
		var tmp = day;
		day = month;
		month = tmp;
	}

	if (! H.date_check(year, month, day)) {
		return null;
	}

	// set date at noon, so daylight savings timezone transtion will not change the day.
	return new Date(year, month - 1, day, 12, 0, 0); 
};

H.date_diff = function (d1, d2)
{
	// Dates' timezones may be different because of daylight savings, so we
	// need to compensate for.
	//
	// Math.round could be enough to do this compensation, but we prefer to
	// be twice as safe.
	
	return Math.round(((d2.getTime() - H.tzoffset(d2)) - (d1.getTime() - H.tzoffset(d1))) / 86400000);
};

H.date_add = function (dbase, days)
{
	// daylight savings timezone not a problem as long as dbase is > 1:01am,
	// so even 1 or 2 hour changes will not change the day.
	dbase.setTime(dbase.getTime() + Math.floor(days) * 86400000);
};

H.date_diff30 = function (d1, d2)
{
	var dd1 = d1.getDate();
	var dd2 = d2.getDate();
	var z1 = dd1;
	var z2 = dd2;

	if (dd1 == 31) {
		z1 = 30;
	}

	if (dd2 == 31) {
		if (dd1 >= 30) {
			z2 = 30;
		}
	}

	var fdt1 = 360 * d1.getFullYear() + 30 * (d1.getMonth() + 1) + z1;
	var fdt2 = 360 * d2.getFullYear() + 30 * (d2.getMonth() + 1) + z2;

	return fdt2 - fdt1;
};

H.date_gen = function (dd, dmy)
{
	if (dmy) {
		return dd.getDate() + (dd.getMonth() + 1) / 100 + dd.getFullYear() / 1000000;
	} else {
		return (dd.getMonth() + 1) + dd.getDate() / 100 + dd.getFullYear() / 1000000;
	}
};

H.date_to_show = function (dd, dmy)
{
	var dow = dd.getDay();
	if (dow === 0) {
		dow = 7;
	}
	return H.date_gen(dd, dmy).toFixed(6) + "  " + dow;
};

H.is_12c = function ()
{
	return H.type === "12c" ||
		H.type === "12c-platinum" ||
		H.type === "12c-bs";
};

/* Some browsers don't have console.log */
window.console = window.console || {};
window.console.log = window.console.log || function (msg) {};
if (typeof console === "undefined") {
	console = window.console;
}
console.log = console.log || window.console.log;

H.type_cookie = "hp12c";
if (H.type === "12c-platinum") {
	H.type_cookie = "hp12cpl";
} else if (H.type === "12c-bs") {
	H.type_cookie = "hp12cbs";
} else if (H.type === "11c") {
	H.type_cookie = "hp11c";
} else if (H.type === "15c") {
	H.type_cookie = "hp15c";
} else if (H.type === "16c") {
	H.type_cookie = "hp16c";
}

H.INTERACTIVE = 0;
H.PROGRAMMING = 1;
H.RUNNING = 2;
H.RUNNING_STEP = 3;

// financial constants (12c)
H.FIN_N = 0;
H.FIN_I = 1;
H.FIN_PV = 2;
H.FIN_PMT = 3;
H.FIN_FV = 4;

// Statistics (map to stomemory)
H.STAT_N  = 1;
H.STAT_X  = 2;
H.STAT_X2 = 3;
H.STAT_Y  = 4;
H.STAT_Y2 = 5;
H.STAT_XY = 6;

if (H.type === "11c") {
	H.STAT_N  = 0;
	H.STAT_X  = 1;
	H.STAT_X2 = 2;
	H.STAT_Y  = 3;
	H.STAT_Y2 = 4;
	H.STAT_XY = 5;
} else if (H.type === "15c") {
	H.STAT_N  = 2;
	H.STAT_X  = 3;
	H.STAT_X2 = 4;
	H.STAT_Y  = 5;
	H.STAT_Y2 = 6;
	H.STAT_XY = 7;
}

H.STAT_MIN = H.STAT_N;
H.STAT_MAX = H.STAT_XY;

// 11C
H.TRIGO_DEG = 0;
H.TRIGO_RAD = 1;
H.TRIGO_GRAD = 2;

// 11C, 15C
H.NOTATION_FIX = 0;
H.NOTATION_SCI = 1;
H.NOTATION_ENG = 2;

// 16C
H.NOTATION_INT = 10; // just for comparisons
H.NOTATION_INT_DEC = H.NOTATION_INT + 1;
H.NOTATION_INT_HEX = H.NOTATION_INT + 2;
H.NOTATION_INT_OCT = H.NOTATION_INT + 3;
H.NOTATION_INT_BIN = H.NOTATION_INT + 4;

H.DEFAULT_WORDSIZE = 16;

H.win_digits = [];
H.win_digits[H.NOTATION_INT_HEX] = 8;
H.win_digits[H.NOTATION_INT_OCT] = 8;
H.win_digits[H.NOTATION_INT_DEC] = 8; // or 10?
H.win_digits[H.NOTATION_INT_BIN] = 8;

H.digit_bits = [];
H.digit_bits[H.NOTATION_INT_HEX] = 4;
H.digit_bits[H.NOTATION_INT_OCT] = 3;
H.digit_bits[H.NOTATION_INT_DEC] = Math.log(10) / Math.log(2); // ~3.32 bits
H.digit_bits[H.NOTATION_INT_BIN] = 1;

H.radix = [];
H.radix[H.NOTATION_INT_HEX] = 16;
H.radix[H.NOTATION_INT_OCT] = 8;
H.radix[H.NOTATION_INT_BIN] = 2;
H.radix[H.NOTATION_INT_DEC] = 10;
// just to simplify some functions that query radix
H.radix[H.NOTATION_FIX] = 10;
H.radix[H.NOTATION_SCI] = 10;
H.radix[H.NOTATION_ENG] = 10;

H.radix_suffix = [];
H.radix_suffix[H.NOTATION_INT_HEX] = "h";
H.radix_suffix[H.NOTATION_INT_OCT] = "o";
H.radix_suffix[H.NOTATION_INT_DEC] = "d";
H.radix_suffix[H.NOTATION_INT_BIN] = "b";

H.value_max = 9.999999 * Math.pow(10, 99);
H.value_min = Math.pow(10, -99);

// 12C defaults
H.ram_MAX = 100;
H.ram_ADDR_SIZE = 2; // e.g. 43.33.00, 43 and 33 are 2 digits
H.STOP_INSTRUCTION = "43.33.00"; // e.g. GTO 00 has 2-digit addr
H.STOP_INSTRUCTION_IS_INVALID = false;
H.INSTRUCTION_SIZE = 2; // size of a non-addr opcode
H.INSTRUCTION_MAX = 100;
H.INSTRUCTION_TOKENS = 3; // e.g. 43.33.00 has 3 tokens

// 12c-BS has the same defaults as 12C vanilla

if (H.type === "12c-platinum") {
	H.ram_MAX = 400;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "43.33.000";
} else if (H.type === "11c") {
	H.ram_MAX = 203;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "16c") {
	H.ram_MAX = 203;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
} else if (H.type === "15c") {
	H.ram_MAX = 322;
	H.ram_ADDR_SIZE = 3;
	H.STOP_INSTRUCTION = "50";
	H.STOP_INSTRUCTION_IS_INVALID = true;
	H.INSTRUCTION_TOKENS = 4; // big 15c exception
}

H.MEM_MAX = 20;

// 12C-BS the same defaults as vanilla

if (H.type == "12c-platinum") {
	H.MEM_MAX = 30;
} else if (H.type == "16c") {
	H.MEM_MAX = 100;
} else if (H.type === "15c") {
	H.MEM_MAX = 66;
}

H.FLAGS_MAX = 2;

if (H.type === "16c") {
	H.FLAGS_MAX = 6;
} else if (H.type === "15c") {
	H.FLAGS_MAX = 10;
}

// 16C flags
H.FLAG_ZEROS = 3;
H.FLAG_CARRY = 4;
H.FLAG_OVERFLOW = 5;

// 15C flags
H.FLAG_COMPLEX = 8;
if (H.type === "15c") {
	H.FLAG_OVERFLOW = 9;
}

// ############### Errors
H.ERROR_DIVZERO = 0;
H.ERROR_OVERFLOW = 1;
H.ERROR_STAT = 2;
H.ERROR_IP = 4;

// 11C, 15C
H.ERROR_INDEX = 3;
H.ERROR_RTN = 5;
H.ERROR_FLAG = 6;

// 15C
H.ERROR_MATRIX_OP = 1;
H.ERROR_RECURSIVE_SOLVE = 7;
H.ERROR_NO_ROOT = 8;
H.ERROR_MATRIX_ARG = 11;
// H.ERROR_DEFECTIVE = 9; // same as 16c, never happens in this simulator

// 12C
H.ERROR_IRR = 3;
H.ERROR_INTEREST = 5;
H.ERROR_MEMORY = 6;
H.ERROR_IRR2 = 7;
H.ERROR_DATE = 8;

// 16C
H.ERROR_IMPROPER_N = 1;
H.ERROR_IMPROPER_BIT = 2;
// H.ERROR_INDEX = 3; // STO register number invalid, same as 11C
// H.ERROR_IP = 4; // same as 11C, 12C
// H.ERROR_RTN = 5 // same as 11C (GOSUB-related error)
H.ERROR_NUMBERFORMAT = 6; // 16C-exclusive, floating point x integer number format
H.ERROR_DEFECTIVE = 9; // same as 15c, never happens in this simulator

H.check_closure_args = function (args)
{
	// replaced by actual checking at unittest_main
};

H.make_closure = function (fname, args, asm)
{
	H.check_closure_args(args);

	var f = function () {
		H.machine[fname].apply(H.machine, args);
	};

	f.closure_type = "machine";
	f.closure_name = fname;
	f.reducible = false;
	f.no_pgrm = 0;
	f.asm = asm;
	f.shrink = 0;

	return f;
};

H.make_pgrm_closure = function (fname, arg, asm)
{
	var f = function () {
		H.pgrm[fname].call(H.pgrm, arg);
	};

	f.closure_type = "pgrm";
	f.closure_name = fname;
	f.reducible = false;
	f.no_pgrm = 0;
	f.asm = asm;
	f.shrink = 0;

	return f;
};

H.delay = function (f, ms)
{
	return window.setTimeout(f, ms);
};

H.cancel_delay = function (handle)
{
	return window.clearTimeout(handle);
};

H.defer = function (f)
{
	return H.delay(f, 0);
};

H.error = function (msg)
{
	console.log(msg);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_debug(format_result)
{
	var self = this;

	self.memwin = null;
	self.format_result = format_result;
}

Hp12c_debug.prototype.format_result_i = function (t)
{
	var self = this;

	var it = {r: t.i, i: t.r, h: t.h};
	return self.format_result(it);
};

Hp12c_debug.prototype.format_matrix = function (t)
{
	var self = this;

	var size = H.machine.matrix_size(t.r);

	return "Mat " +
		(10 + t.r - 20).toString(16).toUpperCase() +
		" (" + size[0] + "x" + size[1] + ")";
};

Hp12c_debug.prototype.show_memory2 = function ()
{
	var self = this;

	if (! self.memwin || ! self.memwin.document) {
		// window has been closed; don't schedule updates anymore
		self.memwin = null;
		return;
	}

	var windoc = self.memwin.document;
	var now = new Date();
	var title = windoc.getElementById('tt');
	var e;

	if (title) {
		title.innerHTML = H.type + " memory at " + now;

		if (H.is_12c()) {
			for (e = 0; e < H.machine.finmemory.length; ++e) {
				windoc.getElementById("finmemory" + e).innerHTML =
					self.format_result({r: H.machine.finmemory[e]});
			}
		}
		for (e = 0; e < H.machine.stomemory.length; ++e) {
			var elem = windoc.getElementById("stomemory" + e);
			if (! elem && e >= 32) {
				// pardon (16c has *lots* of memory)
				continue;
			}
			elem.innerHTML =
				self.format_result(H.machine.sto_tuple(e));
		}
		if (H.is_12c()) {
			for (e = 0; e < H.machine.njmemory.length; ++e) {
				windoc.getElementById("njmemory" + e).innerHTML =
					self.format_result({r: H.machine.njmemory[e]});
			}
		}
		if (H.machine.matrix_in_reg("x")) {
			windoc.getElementById("x").innerHTML =
				self.format_matrix(H.machine.reg_tuple("x"));
			windoc.getElementById("xi").innerHTML = "";
		} else {
			windoc.getElementById("x").innerHTML =
				self.format_result(H.machine.reg_tuple("x"));
			if (H.type === "15c") {
				windoc.getElementById("xi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("x"));
			}
		}
		if (H.machine.matrix_in_reg("last_x")) {
			windoc.getElementById("last_x").innerHTML =
				self.format_matrix(H.machine.reg_tuple("last_x"));
			windoc.getElementById("last_xi").innerHTML = "";
		} else {
			windoc.getElementById("last_x").innerHTML =
				self.format_result(H.machine.reg_tuple("last_x"));
			if (H.type === "15c") {
				windoc.getElementById("last_xi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("last_x"));
			}
		}
		if (H.machine.matrix_in_reg("y")) {
			windoc.getElementById("y").innerHTML =
				self.format_matrix(H.machine.reg_tuple("y"));
			windoc.getElementById("yi").innerHTML = "";
		} else {
			windoc.getElementById("y").innerHTML =
				self.format_result(H.machine.reg_tuple("y"));
			if (H.type === "15c") {
				windoc.getElementById("yi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("y"));
			}
		}
		if (H.machine.matrix_in_reg("z")) {
			windoc.getElementById("z").innerHTML =
				self.format_matrix(H.machine.reg_tuple("z"));
			windoc.getElementById("zi").innerHTML = "";
		} else {
			windoc.getElementById("z").innerHTML =
				self.format_result(H.machine.reg_tuple("z"));
			if (H.type === "15c") {
				windoc.getElementById("zi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("z"));
			}
		}
		if (H.machine.matrix_in_reg("w")) {
			windoc.getElementById("w").innerHTML =
				self.format_matrix(H.machine.reg_tuple("w"));
			windoc.getElementById("wi").innerHTML = "";
		} else {
			windoc.getElementById("w").innerHTML =
				self.format_result(H.machine.reg_tuple("w"));
			if (H.type === "15c") {
				windoc.getElementById("wi").innerHTML =
					self.format_result_i(H.machine.reg_tuple("w"));
			}
		}

		if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
			if (H.machine.matrix_in_index()) {
				windoc.getElementById("index").innerHTML =
				self.format_matrix({r: H.machine.index,
							h: H.machine.indexh,
							i: 0});
			} else {
				windoc.getElementById("index").innerHTML =
				self.format_result({r: H.machine.index, h: 0, i: 0});
			}
		}

		for (e = 0; e < H.machine.ram.length; ++e) {
			var opcode = H.machine.ram[e];
			var asm = H.pgrm.disassemble(opcode);
			var txt = "";
			
			if (opcode && asm !== "NOP") {
				txt = H.pgrm.disassemble(opcode) +
					" <i>(" + opcode + ")</i>";
			}
			windoc.getElementById("ram" + e).innerHTML = txt;
		}
	}

	// closure trick, since 'this' changes meaning inside setTimeout
	H.delay(function () {
		self.show_memory2();
	}, 1000);
};

Hp12c_debug.prototype.show_memory = function ()
{
	var self = this;

	self.memwin = window.open(H.type_cookie + '_memory.html');
	H.delay(function () {
		self.show_memory2();
	}, 1000);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true */
/*global H */

"use strict";

function Hp12c_display()
{
	this.display_max = 9999999999;
	this.display_len = 10; // without extra -
	this.display_min = 0.0000000001;
	this.lcd = [];
	this.contents = "";
	this.contents_alt = "";
	this.blink_delay = 25;
	this.blink_handle = null;
	this.overflow_blink = false;
	this.overflow_blink_timer = null;
	this.overflow_blink_freq = 250; // ms

	var LCD_A = 1;
	var LCD_B = 2;
	var LCD_C = 4;
	var LCD_D = 8;
	var LCD_E = 16;
	var LCD_F = 32;
	var LCD_G = 64;
	var LCD_P = 128;
	var LCD_T = 256;

	this.lcdmap = [];

	this.lcdmap['0'] = LCD_A | LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	this.lcdmap['1'] = LCD_C | LCD_F;
	this.lcdmap['2'] = LCD_A | LCD_C | LCD_D | LCD_E | LCD_G;
	this.lcdmap['3'] = LCD_A | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap['4'] = LCD_B | LCD_C | LCD_D | LCD_F;
	this.lcdmap['5'] = LCD_A | LCD_B | LCD_D | LCD_F | LCD_G;
	this.lcdmap['6'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['7'] = LCD_A | LCD_C | LCD_F;
	this.lcdmap['8'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['9'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap[' '] = 0;
	this.lcdmap['.'] = LCD_P;
	this.lcdmap[','] = LCD_P | LCD_T;
	this.lcdmap['r'] = LCD_A | LCD_B;
	this.lcdmap['U'] = LCD_B | LCD_C | LCD_E | LCD_F | LCD_G;
	this.lcdmap['u'] = LCD_B | LCD_C | LCD_D;
	this.lcdmap['n'] = LCD_B | LCD_C | LCD_A;
	this.lcdmap['i'] = LCD_B;
	this.lcdmap['g'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_F | LCD_G;
	this.lcdmap['-'] = LCD_D;
	this.lcdmap['A'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	this.lcdmap['a'] = this.lcdmap['A'];
	this.lcdmap['B'] = LCD_B | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['b'] = this.lcdmap['B'];
	this.lcdmap['c'] = LCD_D | LCD_E | LCD_G;
	this.lcdmap['C'] = this.lcdmap['c'];
	this.lcdmap['d'] = LCD_C | LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['D'] = this.lcdmap['d'];
	this.lcdmap['E'] = LCD_A | LCD_B | LCD_D | LCD_E | LCD_G;
	this.lcdmap['e'] = this.lcdmap['E'];
	this.lcdmap['F'] = LCD_A | LCD_B | LCD_D | LCD_E;
	this.lcdmap['f'] = this.lcdmap['F'];
	this.lcdmap['H'] = LCD_B | LCD_C | LCD_D | LCD_E | LCD_F;
	this.lcdmap['h'] = LCD_B |         LCD_D | LCD_E | LCD_F;
	this.lcdmap['o'] = LCD_D | LCD_E | LCD_F | LCD_G;
	this.lcdmap['O'] = this.lcdmap["o"];
	this.lcdmap['R'] = LCD_D | LCD_E;
	this.lcdmap['P'] = LCD_A | LCD_B | LCD_C | LCD_D | LCD_E;
	this.lcdmap[':'] = LCD_P;

	for (var e = 0; e <= 10; ++e) {
		this.lcd[e] = [];
		this.lcd[e][0] = 0;
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "a");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "b");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "c");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "d");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "e");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "f");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "g");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "p");
		this.lcd[e][this.lcd[e].length] = H.getElem("lcd" + e + "t");
	}
	
	this.display = H.getElem("display");
	this.dbegin = H.getElem("begin");
	this.ddmyc = H.getElem("dmyc");
	this.dmodifier = H.getElem("modifier");
	this.pgrm = H.getElem("pgrm");
	this.rpnalg = H.getElem("rpnalg");
	this.trigo = H.getElem("trigo");
	this.user = H.getElem("user");
	this.carry = H.getElem("carry");
	this.overflow = H.getElem("overflow");
	this.complex = H.getElem("complex");
	this.altdisplay = H.getElem("altdisplay");
	this.wordstatus = H.getElem("wordstatus");
	this.undo = H.getElem("undo");
	this.parentheses = H.getElem("parentheses");

	this.clear();
}

Hp12c_display.prototype.setInnerHTML = function (name, txt)
{
	if (H.embedded) {
		this.display.setInnerHTML(name, txt);
	} else {
		var tgt = this[name];
		if (tgt) {
			tgt.innerHTML = txt;
		}
	}
};

Hp12c_display.prototype.private_lcd_display = function (txt) 
{
	var f = -1;
	var buffer = [];

	for (var e = 0; e < txt.length && f < this.lcd.length; ++e) {
		var merge = false;
		var val = txt.charAt(e);
		++f;
		if ((val == '.' || val == ',') && f > 0) {
			// merge decimal point/thousand separator
			--f;
			merge = true;
		}
		if (! this.lcdmap[val]) {
			val = ' ';
		}
		var map = this.lcdmap[val];
		buffer[f] = map | (merge ? buffer[f] : 0);
	}
	for (++f; f < this.lcd.length; ++f) {
		buffer[f] = 0;
	}

	if (H.embedded) {
		this.display.showDisplay(buffer);
		return;
	}

	for (f = 0; f < buffer.length; ++f) {
		map = buffer[f];
		for (var segm = 1; segm < 10; ++segm) {
			var bit = 1 << (segm - 1);
			var visibility = (map & bit) ? "visible" : "hidden";
			if (this.lcd[f][segm].style.visibility !== visibility) {
				this.lcd[f][segm].style.visibility = visibility;
			}
		}
	}
};

Hp12c_display.prototype.show = function (txt)
{
	// console.log("display show: " + txt);
	this.cancel_overflow_blink();
	this.contents = txt;
	this.private_lcd_display(txt);
	this.start_overflow_blink();
};

Hp12c_display.prototype.set_blink = function (blinks)
{
	this.overflow_blink = blinks;
	this.cancel_overflow_blink();
	this.start_overflow_blink();
};

Hp12c_display.prototype.cancel_overflow_blink = function ()
{
	if (this.overflow_blink_timer) {
		window.clearInterval(this.overflow_blink_timer);
		this.overflow_blink_timer = null;
	}
};

Hp12c_display.prototype.start_overflow_blink = function ()
{
	var self = this;

	if (! this.overflow_blink) {
		return;
	}

	this.overflow_blink_on = true;
	this.overflow_blink_timer =
		window.setInterval(function () {
			self.overflow_blink_on = ! self.overflow_blink_on;
			if (self.overflow_blink_on) {
				self.private_lcd_display(self.contents);
			} else {
				self.private_lcd_display("");
			}
		},
		this.overflow_blink_freq);
};

Hp12c_display.prototype.show_alt = function (txt)
{
	this.contents_alt = txt;
	this.setInnerHTML("altdisplay", txt);
};

Hp12c_display.prototype.html_wrap = function (txt)
{
	var j = 0;
	var c;
	for (var i = 0; i < txt.length; ++i) {
		c = txt.charAt(i);
		++j;
		if (j > 13 || (j > 9 && (c === "." || c === ","))) {
			txt = txt.substr(0, i + 1) + "<br>" + txt.substr(i + 1);
			i += 4;
			j = 0;
		}
	}

	return txt;
};

Hp12c_display.prototype.show_wordstatus = function (txt)
{
	this.setInnerHTML("wordstatus", txt);
};

Hp12c_display.prototype.show_parentheses = function (txt)
{
	this.setInnerHTML("parentheses", txt);
};

Hp12c_display.prototype.show_undo = function (enabled)
{
	this.setInnerHTML("undo", enabled ? "u" : "");
};

Hp12c_display.prototype.clear = function ()
{
	this.private_lcd_display("");
	this.show_alt("");
	this.show_wordstatus("");
};

Hp12c_display.prototype.format_result_tuple = function (t)
{
	if (H.machine.notation < H.NOTATION_INT) {
		return this.format_result(t.r);
	}
	return this.format_result_int(t);
};

Hp12c_display.prototype.format_result = function (n)
{
	var res = "";
	var absn = Math.abs(n);
	var fix_dec = H.machine.decimals;
	var mantissa_dec = H.machine.decimals;
	var notation = H.machine.notation;
	var degenerate = 0;
	var scale;
	var mantissa;

	if (n >= H.value_max) {
		degenerate = 1;
		scale = 99;
		n = H.value_max;
		absn = Math.abs(n);
	} else if (n <= -H.value_max) {
		degenerate = 2;
		scale = 99;
		n = -H.value_max;
		absn = Math.abs(n);
	} else if (absn >= H.value_min) {
		scale = Math.log(absn) / Math.log(10);
		// added a tad to guarantee that log(10) === 1
		scale = Math.floor(scale + 0.00000000001);
	} else {
		degenerate = 3;
		scale = -100;
		absn = n = 0;
	}

	var co = H.machine.comma;

	if (notation == H.NOTATION_FIX) {
		mantissa_dec = 6;
		if (absn > this.display_max) {
			// too big to be shown normally
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && scale < -9) {
			// too small to be shown normally
			notation = H.NOTATION_SCI;
		} else if (absn !== 0 && fix_dec < (-scale)) {
			// we need more decimals to show this number
			fix_dec = -scale;
		}
	}

	mantissa_dec = Math.min(mantissa_dec, 6);

	if (degenerate != 3) {
		mantissa = n / Math.pow(10, scale);
	} else {
		mantissa = 0;
	}

	// handle rounding up
	var mantissa_signal = mantissa >= 0 ? 1 : -1;
	mantissa = parseFloat(Math.abs(mantissa).toFixed(mantissa_dec));
	if (notation != H.NOTATION_FIX && mantissa >= 10) {
		mantissa /= 10;
		scale += 1;
	}
	// give signal back
	mantissa *= mantissa_signal;

	// until now, ENG handling == SCI
	// now, compensate for ENG
	if (notation == H.NOTATION_ENG && (! degenerate)) {
		var new_scale = 3 * Math.floor(scale / 3);
		while (scale > new_scale) {
			mantissa *= 10;
			scale -= 1;
			if (mantissa_dec > 0) {
				mantissa_dec -= 1;
			}
		}
	}

	if (notation !== H.NOTATION_FIX) {
		// show as exponential
		/*
		if (mantissa === 0 && (H.type !== "11c" && H.type !== "15c") && false) {
			// in SCI mode, 12C shows 0.0000000 00 too...
			return H.i18n(' 0', co, 1);
		*/
		if (degenerate == 1) {
			return H.i18n(' 9.999999 99', co, 1);
		} else if (degenerate == 2) {
			return H.i18n('-9.999999 99', co, 1);
		}

		res = H.i18n(mantissa.toFixed(mantissa_dec), co, 1);
		if (mantissa >= 0) {
			res = " " + res;
		}

		// no need to compensate for thousand separators because even
		// in ENG mode mantissa is < 1000.

		// display_len does NOT count the negative sign
		// -3: exponential plus space/expo signal
		// +1: compressed decimal point (always present, even if mantissa_dec == 0)
		// +1: negative sign
		var max_m_len = this.display_len - 3 + 1 + 1;

		res = res.substr(0, max_m_len);
		while (res.length < max_m_len) {
			res = res + " ";
		}

		if (mantissa === 0) {
			scale = 0;
		}

		if (scale < 0) {
			res = res + "-" + H.zeropad((-scale).toFixed(0), 2);
		} else {
			res = res + " " + H.zeropad(scale.toFixed(0), 2);
		}
		// console.log(" " + n + " " + mantissa + " " + scale + " d " + degenerate + " " + res);

		return res;
	}

	// show as fixed, w/o exp
	var dec = Math.max(0, fix_dec);
	var sgn = n < 0 ? "-" : " ";
	n = Math.abs(n);
	var ll = n.toFixed(dec).length - (dec > 0 ? 1 : 0);
	if (ll > this.display_len) {
		// reduce decimals if too big for display
		dec -= (ll - this.display_len);
		dec = Math.max(0, dec);
	}
	res = H.i18n(sgn + n.toFixed(dec), co, 1);

	return res;
};

Hp12c_display.prototype.get_radix = function ()
{
	var radix = H.radix[H.machine.notation];
	var suffix = H.radix_suffix[H.machine.notation];

	return [radix, suffix];
};

Hp12c_display.prototype.integer_to_string = function (t, radix)
{
	// for non-decimal, how as unsigned
	var negative_repr = 0;
	if (radix === 10) {
		negative_repr = H.machine.negative_repr;
	}

	var spure = H.integer_to_string(t,
					negative_repr,
					H.machine.wordsize,
					radix,
					true);

	return spure;
};

Hp12c_display.prototype.format_result_int = function (t)
{
	var radix = this.get_radix()[0];
	return this.integer_to_string(t, radix);
};

Hp12c_display.prototype.p_display_integer = function (x, xmode, typed_digits)
{
	var typing = xmode > -100; // -100, -1, 0
	var point1 = "";
	var point2 = "";
	var sign = " ";
	var show_apocryphal = (H.machine.altdisplay > 0);

	var radix = this.get_radix();
	var suffix = radix[1];
	radix = radix[0];

	var spure = this.integer_to_string(x, radix);
	var spure16;
	if (radix === 2) {
		spure16 = this.integer_to_string(x, 16);
	}
	// console.log(spure);

	if (spure.substr(0, 1) === "-") {
		spure = spure.substr(1);
		sign = "-";
	}

	var s, sfull;
	var len = 8;

	var bits_per_digit = H.digit_bits[H.machine.notation];
	var digits_on_display = H.win_digits[H.machine.notation];
	var tot_digits = Math.ceil(H.machine.wordsize / bits_per_digit);
	var wincount = H.machine.window_count();
	var tot_digits_ceil = wincount * digits_on_display;

	var si2 = spure;
	var significant_digits = si2.length;
	var significant_windows = Math.ceil(significant_digits /
						digits_on_display);

	if (typing) {
		while (si2.length < typed_digits) {
			si2 = "0" + si2;
		}
	}

	var current_window = typing ? 0 : H.machine.intwindow;

	show_apocryphal = show_apocryphal &&
				(significant_windows > 1 || current_window > 0);

	var filler = " ";
	if (H.machine.get_zeros_flag() && radix !== 10) {
		filler = "0";
	}

	while (si2.length < tot_digits) {
		si2 = filler + si2;
	}

	while (si2.length < tot_digits_ceil) {
		si2 = " " + si2;
	}

	if (current_window > 0) {
		point2 = ".";
	}
	if (current_window < (significant_windows - 1)) {
		point1 = ".";
	}

	// window cutting
	var dpos;
	dpos = (wincount - current_window - 1) * digits_on_display;
	si2 = si2.substr(dpos, digits_on_display);
	// convert dpos to "last digit = 0"
	dpos = current_window * digits_on_display;

	var lcdsign = sign;

	if (radix === 10) {
		var sp = si2.lastIndexOf(" ");
		if (sp >= 0) {
			si2 = si2.substr(0, sp) + lcdsign + si2.substr(sp + 1);
			lcdsign = " ";
		} else if (point1 === ".") {
			// next window has significant digits
			// do not show LCD sign
			lcdsign = " ";
		} else {
			// this window is full but next window does not
			// have significant digits
			// leave LCD sign in place
		}
	}

	// if radix = 10 and window > 0, i18n() might put decimal places
	// in wrong values, because si2 has been cut. We add zeros as
	// LSBs until the LSB is a multiple of 3, so i18n(si2) does well.
	var r10comp = 0;
	while (radix === 10 && ((dpos - r10comp) % 3) > 0) {
		si2 += "0";
		r10comp++;
	}
	si2 = H.i18n(si2, H.machine.comma, 0, radix === 10 ? 3 : 4);
	// Remove LSB compensation, if it was made above
	if (radix === 10 && r10comp > 0) {
		si2 = si2.substr(0, si2.length - r10comp);
	}
	s = lcdsign + si2 + " " + point1 + suffix + point2;

	sfull = sign + (radix === 2 ? spure16 : spure);
	sfull = H.i18n(sfull, H.machine.comma, 0, radix === 10 ? 3 : 4);

	this.show(s);
	if (show_apocryphal) {
		this.show_alt(this.html_wrap(sfull));
	} else {
		this.show_alt("");
	}
};

Hp12c_display.prototype.displayNumber_now_integer = function (x)
{
	this.p_display_integer(x, -100);
};

Hp12c_display.prototype.displayMatrix = function (n, r, c)
{
	var self = this;

	self.cancel_blinked();

	var s = " " + (10 + n - 20).toString(16).toUpperCase() +
		" " + r + ", " + c;
	self.show(s);
	self.show_alt("");
};

Hp12c_display.prototype.displayNumber_now = function (x)
{
	if (H.type === "16c" && H.machine.notation >= H.NOTATION_INT) {
		this.displayNumber_now_integer(x);
		return;
	}

	var co = H.machine.comma;
	x = x.r || 0;

	if (x > H.value_max) {
		x = H.value_max;
	} else if (x < -H.value_max) {
		x = -H.value_max;
	} else if (Math.abs(x) < H.value_min) {
		x = 0;
	}

	// display result
	var sres = this.format_result(x);
	this.show(sres);
	this.show_alt("");
};

Hp12c_display.prototype.cancel_blinked = function ()
{
	var self = this;

	if (self.blink_handle !== null) {
		H.machine.sti("display");
		H.cancel_delay(self.blink_handle);
		self.blink_handle = null;
	}
};


Hp12c_display.prototype.start_blinked = function (x)
{
	var self = this;

	H.machine.cli("display");
	self.show("");

	self.cancel_blinked(); // innocuous if no blink in progress

	self.blink_handle = H.delay(function () {
		self.blink_handle = null;
		H.machine.sti("display");
		self.displayNumber_now(x);
	}, self.blink_delay);
};

Hp12c_display.prototype.displayNumber = function (x)
{
	var self = this;

	self.start_blinked(x);
};

Hp12c_display.prototype.displayTypedNumber_integer = function (val, xmode, digits)
{
	var self = this;

	self.cancel_blinked();
	this.p_display_integer(val, xmode, digits);
};

Hp12c_display.prototype.displayTypedNumber = function (ms, m, dec, exp, exps, xmode)
{
	var self = this;

	self.cancel_blinked();

	var s = "";
	var co = H.machine.comma;

	if (xmode === 0) {
		s = " 0";
		if (m.length > 0) {
			s = (ms < 0 ? "-" : " ") + m;
		}
		if (H.type !== "11c" && H.type !== "15c") {
			s += ".";
		}
		s = H.i18n(s, co, 0);
	} else if (xmode === 1) {
		s = H.i18n((ms < 0 ? "-" : " ") + m + "." + dec, co, 1);
	} else if (xmode === 100) {
		var rdec = dec.substr(0, 7 - m.length);
		s = H.i18n((ms < 0 ? "-" : " ") + m + "." + rdec, co, 1);
		for (var i = 0; i < (7 - rdec.length - m.length); ++i) {
			s += " ";
		}
		s += exps < 0 ? "-" : " ";
		s += H.zeropad(parseInt("0" + exp, 10).toFixed(0), 2);
	}
	this.show(s);
	this.show_alt("");
};

H.mod_stt = null;

Hp12c_display.prototype.modifier_table = function ()
{
	if (H.mod_stt) {
		return H.mod_stt;
	}

	var a = [];

	a[0] = "";
	a[H.FF] = "f";
	a[H.GG] = "g";
	a[H.STO] = "STO";
	a[H.STO2] = "STO★";
	a[H.RCL] = "RCL";
	a[H.RCL2] = "RCL★";
	
	if (H.type !== "16c") {
		a[H.STO_PLUS] = "STO+";
		a[H.STO_MINUS] = "STO-";
		a[H.STO_TIMES] = "STO×";
		a[H.STO_DIVIDE] = "STO÷";
	}

	a[H.GTO] = "GTO";
	a[H.GTO_MOVE] = "GTO★";

	if (H.is_12c()) {
		a[H.RCL_GG] = "RCL g";
	}

	if (H.type === "11c" || H.type === "15c") {
		a[H.HYP] = "HYP";
		a[H.HYPINV] = "HYP-1";
		a[H.LBL] = "LBL";
		a[H.GSB] = "GSB";
		a[H.FIX] = "FIX";
		a[H.SCI] = "SCI";
		a[H.ENG] = "ENG";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.RCL_GG] = "RCL g";
		a[H.GG_SF] = "SF";
		a[H.GG_CF] = "CF";
		a[H.GG_FQUESTION] = "F?";

		a[H.STO_PLUS_FF] = "STO+ f";
		a[H.STO_MINUS_FF] = "STO- f";
		a[H.STO_TIMES_FF] = "STO× f";
		a[H.STO_DIVIDE_FF] = "STO÷ f";
	}

	if (H.type === "15c") {
		a[H.GTO_DOT] = "GTO★";
		a[H.GSB_DOT] = "GSB★";
		a[H.LBL_DOT] = "LBL★";

		a[H.STO_PLUS_DOT] = "STO+★";
		a[H.STO_MINUS_DOT] = "STO-★";
		a[H.STO_TIMES_DOT] = "STO×★";
		a[H.STO_DIVIDE_DOT] = "STO÷★";

		a[H.RCL_PLUS] = "RCL+";
		a[H.RCL_MINUS] = "RCL-";
		a[H.RCL_TIMES] = "RCL×";
		a[H.RCL_DIVIDE] = "RCL÷";

		a[H.RCL_PLUS_DOT] = "RCL+★";
		a[H.RCL_MINUS_DOT] = "RCL-★";
		a[H.RCL_TIMES_DOT] = "RCL×★";
		a[H.RCL_DIVIDE_DOT] = "RCL÷★";

		a[H.RCL_PLUS_FF] = "STO+ f";
		a[H.RCL_MINUS_FF] = "STO- f";
		a[H.RCL_TIMES_FF] = "STO× f";
		a[H.RCL_DIVIDE_FF] = "STO÷ f";

		a[H.FF_EXCHANGE] = "X⇄";
		a[H.FF_EXCHANGE_DOT] = "X⇄★";

		a[H.SOLVE] = "SOLV";
		a[H.SOLVE_DOT] = "SOLV★";
		a[H.INTEG] = "INTG";
		a[H.INTEG_DOT] = "INTG★";
		a[H.GG_TEST] = "TEST";

		a[H.DIM] = "DIM";
		a[H.RCL_DIM] = "RCL D";
		a[H.MATRIX] = "M";
		a[H.STO_GG] = "STO g";
		a[H.STO_MATRIX] = "STO M";
		a[H.STO_FF_MATRIX] = "STO M";
		a[H.RCL_MATRIX] = "RCL M";
		a[H.RCL_FF_MATRIX] = "RCL M";
		a[H.RESULT] = "Res";

		a[H.ISG] = "ISG";
		a[H.ISG_DOT] = "ISG★";
		a[H.DSE] = "DSE";
		a[H.DSE_DOT] = "DSE★";
	}

	if (H.type === "16c") {
		a[H.LBL] = "LBL";
		a[H.GSB] = "GSB";
		a[H.GG_SF] = "SF";
		a[H.GG_CF] = "CF";
		a[H.GG_FQUESTION] = "F?";
		a[H.STO_FF] = "STO f";
		a[H.RCL_FF] = "RCL f";
		a[H.WINDOW] = "WINDOW";
		a[H.FLOAT] = "FLOAT";
	}

	H.mod_stt = a;
	return H.mod_stt;
};

Hp12c_display.prototype.show_modifier = function (m)
{
	var txt = this.modifier_table()[m];
	if (txt === undefined || txt === null) {
		H.error("Display: unknown modifier " + m);
		txt = "";
	}

	this.setInnerHTML("dmodifier", txt);
};

Hp12c_display.prototype.show_begin = function (is_begin)
{
	var txt = "";
	if (is_begin) {
		txt = "BEGIN";
	}

	this.setInnerHTML("dbegin", txt);
};

Hp12c_display.prototype.show_carry = function (is_carry)
{
	var txt = "";
	if (is_carry) {
		txt = "C";
	}

	if (H.type === "16c") {
		this.setInnerHTML("carry", txt);
	}
};

Hp12c_display.prototype.show_overflow = function (is_overflow)
{
	var txt = "";
	if (is_overflow) {
		txt = "G";
	}

	if (H.type === "16c") {
		this.setInnerHTML("overflow", txt);
	}
};

Hp12c_display.prototype.show_complex = function (is_complex)
{
	var txt = "";
	if (is_complex) {
		txt = "C";
	}

	if (H.type === "15c") {
		this.setInnerHTML("complex", txt);
	}
};

Hp12c_display.prototype.show_error = function (err)
{
	this.show("ERROR " + err);
	this.show_alt("");
};

Hp12c_display.prototype.display_meminfo = function (mem, stolen)
{
	--stolen;
	var stolen_txt = stolen.toFixed(0);
	if (H.type !== "16c") {
		stolen_txt = (stolen % 10).toFixed(0);
		if (stolen >= 10) {
			stolen_txt = ":" + stolen_txt;
		}
	}
	this.show("P-" + H.zeropad(mem, H.ram_ADDR_SIZE) + " R-" + stolen_txt);
	this.show_alt("");
};

Hp12c_display.prototype.show_dmyc = function (dmy, compoundf)
{
	var txt = "";
	if (dmy) {
		txt += "D.MY";
	}
	if (compoundf) {
		txt += "&nbsp;&nbsp;C";
	}

	this.setInnerHTML("ddmyc", txt);
};

Hp12c_display.prototype.show_pse = function ()
{
	this.setInnerHTML("dmodifier", "PAUSE");
};

Hp12c_display.prototype.show_pgrm = function (pgrm, run, pc)
{
	var txt = "";
	if (pgrm) {
		txt = "PRGM";
	} else if (run) {
		txt = "RUN " + H.zeropad(pc.toFixed(0), 2);
	}

	this.setInnerHTML("pgrm", txt);
};

Hp12c_display.prototype.show_algmode = function (algmode)
{
	if (H.type === "12c-platinum") {
		var txt = ["RPN", "ALG"][algmode];
		this.setInnerHTML("rpnalg", txt);
	}
};

Hp12c_display.prototype.show_trigo = function (trigo)
{
	if (H.type === "11c" || H.type === "15c") {
		var txt = ["", "RAD", "GRAD"][trigo];
		this.setInnerHTML("trigo", txt);
	}
};

Hp12c_display.prototype.show_user = function (user)
{
	if (H.type === "11c" || H.type === "15c") {
		var txt = ["", "USER"][user];
		this.setInnerHTML("user", txt);
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_keyboard()
{
	var self = this;

	self.is_enabled = 0;
	self.kbdtable = {};
	self.kbdtable['0'] = 0;
	self.kbdtable['.'] = 48;
	self.kbdtable[','] = 48;
	self.kbdtable['1'] = 1;
	self.kbdtable['2'] = 2;
	self.kbdtable['3'] = 3;
	self.kbdtable['4'] = 4;
	self.kbdtable['5'] = 5;
	self.kbdtable['6'] = 6;
	self.kbdtable['7'] = 7;
	self.kbdtable['8'] = 8;
	self.kbdtable['9'] = 9;
	self.kbdtable['+'] = 40;
	self.kbdtable['='] = 40;
	self.kbdtable['-'] = 30;
	self.kbdtable['*'] = 20;
	self.kbdtable['x'] = 20;
	self.kbdtable['X'] = 20;
	self.kbdtable['/'] = 10;
	self.kbdtable[':'] = 10;
	self.kbdtable['\r'] = 36;
	self.kbdtable['\n'] = 36;
	self.kbdtable[' '] = 36;
	self.kbdtable['f'] = 42;
	self.kbdtable['F'] = 42;
	self.kbdtable['g'] = 43;
	self.kbdtable['G'] = 43;
	self.kbdtable['s'] = 44;
	self.kbdtable['S'] = 44;
	self.kbdtable['r'] = 45;
	self.kbdtable['R'] = 45;
	self.kbdtable['o'] = 41;
	self.kbdtable['O'] = 41;

	H.hp1xc_keyboard_flavor(self.kbdtable);

	// stay here while vertical map translation is uniform across models
	self.vertical_map = {};
	self.vertical_map[0] = -1;
	self.vertical_map[1] = 11;
	self.vertical_map[2] = 12;
	self.vertical_map[3] = 13;
	self.vertical_map[4] = 14;
	self.vertical_map[5] = 15;
	self.vertical_map[10] = -1;
	self.vertical_map[11] = 21;
	self.vertical_map[12] = 22;
	self.vertical_map[13] = 23;
	self.vertical_map[14] = 24;
	self.vertical_map[15] = 25;
	self.vertical_map[20] = 41;
	self.vertical_map[21] = 31;
	self.vertical_map[22] = 32;
	self.vertical_map[23] = 33;
	self.vertical_map[24] = 34;
	self.vertical_map[25] = 35;
	self.vertical_map[30] = 45;
	self.vertical_map[31] = 16;
	self.vertical_map[32] = 7;
	self.vertical_map[33] = 8;
	self.vertical_map[34] = 9;
	self.vertical_map[35] = 10;
	self.vertical_map[40] = 44;
	self.vertical_map[41] = 26;
	self.vertical_map[42] = 4;
	self.vertical_map[43] = 5;
	self.vertical_map[44] = 6;
	self.vertical_map[45] = 20;
	self.vertical_map[50] = 43;
	self.vertical_map[51] = 36;
	self.vertical_map[52] = 1;
	self.vertical_map[53] = 2;
	self.vertical_map[54] = 3;
	self.vertical_map[55] = 30;
	self.vertical_map[60] = 42;
	self.vertical_map[61] = 36;
	self.vertical_map[62] = 0;
	self.vertical_map[63] = 48;
	self.vertical_map[64] = 49;
	self.vertical_map[65] = 40;

	H.hp1xc_vertical_keyboard_flavor(self.vertical_map);

	self.pointer_div = H.getElem("pointer_div");

	// recalculate keyboard coordinates
	// based on original ones for 700x438 image
	if (H.embedded) {
		self.kx = 1;
		self.ky = 1;
	} else {
		self.kx = parseInt(self.pointer_div.style.width, 10) / H.disp_theo_width;
		self.ky = parseInt(self.pointer_div.style.height, 10) / H.disp_theo_height;
	}

	self.microsoft = (window.navigator && window.navigator.msPointerEnabled && true);
	
	var o = this;

	if (H.touch_display) {
		if (self.microsoft) {
			var handler = function (x) {
				o.mouse_click(x);
			};
			window.cross.addEventListener("MSPointerDown", handler, true);
		} else {
			H.getElem("cross").ontouchstart = function (x) {
				o.mouse_click(x);
			};
		}
	} else {	
		H.getElem("cross").onclick = function (x) {
			o.mouse_click(x);
		};
	}
	document.onkeypress = function (x) {
		o.hard_keyboard(x);
	};
}

Hp12c_keyboard.prototype.enable = function ()
{
	var self = this;

	self.is_enabled = 1;
	// console.log("kbd enabled ");
};

Hp12c_keyboard.prototype.disable = function ()
{
	var self = this;

	self.is_enabled = 0;
	// console.log("kbd disabled ");
};

Hp12c_keyboard.prototype.enabled = function ()
{
	var self = this;

	return self.is_enabled;
};

Hp12c_keyboard.prototype.remap_key_vertical = function (raw)
{
	var self = this;
	var key = -1;
	var candidate = self.vertical_map[raw];
	if (candidate !== null && candidate !== undefined) {
		key = candidate;
	}

	return key;
};

Hp12c_keyboard.prototype.remap_key = function (raw)
{
	var self = this;

	// map 'raw' keys to HP12-compatible key codes

	var hpkey = raw + 11;  // key 0 ("n") becomes key 11
	var col = (hpkey % 10); // "n" is at column 1; Divide is at column 0
	if (col === 0) {
		// "Divide" is not the key 20; it is the key 10
		// this operation does NOT change column value
		hpkey -= 10;
	}
	var row = Math.floor(hpkey / 10); // "n" and Device are at line 1

	if (hpkey == 47 /* zero */ ) {
		hpkey = 0;
	} else if (col >= 7 && col <= 9 && hpkey != 48 /* point */ && hpkey != 49 /*sigma+*/) {
		// numeric keys: key code is equal to the number it represents
		hpkey = col - 3 * (row - 1);
	}

	if (hpkey == 46) {
		// ENTER exception
		hpkey = 36;
	}
	
	return hpkey;
};

Hp12c_keyboard.prototype.hard_keyboard = function (e)
{
	var self = this;

	var keynum;
	var keychar;
	var numcheck;

	if (window.event) {
		e = window.event;
		keynum = window.event.keyCode;
	} else if (e.which) {
		keynum = e.which;
	} else {
		return true;
	}

	keychar = String.fromCharCode(keynum);

	var ret = true;
	var kk = self.kbdtable[keychar];
	if (kk !== undefined && kk !== null) {
		if (self.enabled()) {
			H.dispatcher.dispatch(self.kbdtable[keychar]);
		}
		e.returnValue = false;
		if (e.preventDefault) {
			e.preventDefault();
		}
		ret = false;
	}
	return ret;
};

Hp12c_keyboard.prototype.mouse_click = function (evt)
{
	var self = this;

	if (! evt) {
		evt = window.event;
	}

	self.xoff = H.disp_key_offset_x * self.kx;
	self.yoff = H.disp_key_offset_y * self.ky;

	self.xl = H.disp_key_width * self.kx;
	self.yl = H.disp_key_height * self.ky;

	self.xd = H.disp_key_dist_x * self.kx;
	self.yd = H.disp_key_dist_y * self.ky;

	var pos_x, pos_y;

	if (H.embedded) {
		pos_x =	evt.X - self.xoff;
		pos_y = evt.Y - self.yoff;
	} else if (H.touch_display) {
		evt.preventDefault();
		if (self.microsoft) {
			pos_x =	(evt.pageX - self.pointer_div.offsetLeft) - self.xoff;
			pos_y = (evt.pageY - self.pointer_div.offsetTop) - self.yoff;
		} else {
			pos_x =	(evt.targetTouches[0].pageX - self.pointer_div.offsetLeft) - self.xoff;
			pos_y = (evt.targetTouches[0].pageY - self.pointer_div.offsetTop) - self.yoff;
		}
	} else {
		pos_x = (evt.offsetX ? evt.offsetX : 
			(evt.pageX - self.pointer_div.offsetLeft)) - self.xoff;
		pos_y = (evt.offsetY ? evt.offsetY :
			(evt.pageY - self.pointer_div.offsetTop)) - self.yoff;
	}

	var key;
	var in_key;

	if (H.vertical_layout) {
		if (pos_x < 0 || pos_y < 0 || pos_x >= self.xd * 6 || pos_y >= self.yd * 7) {
			return;
		}

		key = Math.floor(pos_x / self.xd) + 10 * Math.floor(pos_y / self.yd);

		while (pos_x > self.xd) {
			pos_x -= self.xd;
		}

		while (pos_y > self.yd) {
			pos_y -= self.yd;
		}

		in_key = (pos_x < self.xl) && ((pos_y < self.yl) || key == 51);
		if (in_key) {
			key = self.remap_key_vertical(key);
			if (key >= 0) {
				if (self.enabled()) {
					H.dispatcher.dispatch(key);
				}
			}
		}
	} else {
		if (pos_x < 0 || pos_y < 0 || pos_x >= self.xd * 10 || pos_y >= self.yd * 4) {
			return;
		}

		key = Math.floor(pos_x / self.xd) + 10 * Math.floor(pos_y / self.yd);

		while (pos_x > self.xd) {
			pos_x -= self.xd;
		}

		while (pos_y > self.yd) {
			pos_y -= self.yd;
		}

		in_key = (pos_x < self.xl) && ((pos_y < self.yl) || key == 25);
		if (in_key) {
			if (self.enabled()) {
				H.dispatcher.dispatch(self.remap_key(key));
			}
		}
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, sub: true, bitwise: true */
/*global H */

"use strict";

H.hp1xc_keyboard_flavor = function (kbdtable)
{
	// 15C layout: same as 11C
	kbdtable['w'] = 49;
	kbdtable['W'] = 49;
	kbdtable['y'] = 34;
	kbdtable['Y'] = 34;
	kbdtable['h'] = 16;
	kbdtable['H'] = 16;
	kbdtable['u'] = 32; // gsb
	kbdtable['U'] = 32;
	kbdtable['t'] = 22; // gto
	kbdtable['T'] = 22;
	kbdtable['i'] = 23; // sin
	kbdtable['I'] = 23;
	kbdtable['j'] = 24; // cos
	kbdtable['J'] = 24;
	kbdtable['k'] = 25; // tan
	kbdtable['K'] = 25;
	kbdtable['n'] = 33; // rdown
	kbdtable['N'] = 33;
	kbdtable[String.fromCharCode(40)] = 33;
	kbdtable['a'] = 11;
	kbdtable['A'] = 11;
	kbdtable['b'] = 12;
	kbdtable['B'] = 12;
	kbdtable['c'] = 13;
	kbdtable['C'] = 13;
	kbdtable['d'] = 14;
	kbdtable['D'] = 14;
	kbdtable['e'] = 15;
	kbdtable['E'] = 15;
	kbdtable['p'] = 26;
	kbdtable['P'] = 26;
	kbdtable['!'] = 14;
	kbdtable['\\'] = 15;
	kbdtable['['] = 31;
	kbdtable[']'] = 21; 
	kbdtable['?'] = 99;
	kbdtable[String.fromCharCode(8)] = 35;
	kbdtable['Z'] = 35;
	kbdtable['z'] = 35;
};

H.hp1xc_vertical_keyboard_flavor = function (vmap)
{
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true */
/*global H */

"use strict";

// test with 12C and 11C

function Hp12c_machine()
{
	// algebraic operations

	this.nvname = H.type_cookie;

	// TODO this should be in init_memory()
	// and unit tests should wait it to go back to 1
	this.sti_level = 0;

	this.init_memory();
}


/* Can be called before display and other components are still uninitialized */
Hp12c_machine.prototype.init_memory = function (n)
{
	// calculator non-volatile memory -----------------------------------------------------------

	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.w = 0;
	this.last_x = 0;

	// 15C imaginary parts of each register
	this.xi = 0;
	this.yi = 0;
	this.zi = 0;
	this.wi = 0;
	this.last_xi = 0;

	this.mA = [];
	this.mB = [];
	this.mC = [];
	this.mD = [];
	this.mE = [];
	this.msA = [0, 0];
	this.msB = [0, 0];
	this.msC = [0, 0];
	this.msD = [0, 0];
	this.msE = [0, 0];
	this.mR = 20; // A=20, B=21 ...

	// 16C "high" parts of 64-bit integer numbers
	// 15C also use these flags as matrix pointers
	this.xh = 0;
	this.yh = 0;
	this.zh = 0;
	this.wh = 0;
	this.last_xh = 0;
	// 15C matrixes never go to STO memories
	this.stomemoryh = [];

	this.wordsize = H.DEFAULT_WORDSIZE;
	this.intwindow = 0;
	this.negative_repr = 2;

	this.stomemory = [];
	this.finmemory = [];
	this.njmemory = [];
	this.index = 0; // not-12C
	this.indexh = 0; // 15C

	this.ram = [];
	this.program_size = 1; // for STOP in [0]
	this.flags = [];

	var i;
	for (i = 0; i < H.FLAGS_MAX; ++i) {
		this.flags[i] = 0;
	}

	this.decimals = 2;
	this.comma = 0; 
	this.altdisplay = 1; // 16c alternative (apocryphal) displays

	this.begin = 0;
	this.dmy = 0;
	this.compoundf = 0;

	this.notation = H.NOTATION_FIX;
	if (H.type === "16c") {
		this.notation = H.NOTATION_INT_HEX;
	}
	this.trigo = H.TRIGO_DEG;
	this.complex = 0;
	this.user = 0;

	this.prng = new H.Prng(0);

	// 15C thing to handle solve, integration
	this.running_context = [];
	this.osolve = null;
	this.ointegrate = null;

	// volatile memory ---------------------------------------------------------------------

	this.UNDOABLE_NONE = 0;
	this.UNDOABLE_CLX = 1;
	this.UNDOABLE_BSP = 2;
	this.UNDOABLE_BSP_TYPING = 3;
	this.UNDOABLE_CLEAR_REG = 4;
	this.UNDOABLE_CLEAR_STAT = 5;
	this.UNDOABLE_CLEAR_FIN = 6;

	this.algmode = 0;
	this.algebra = [];
	this.undoable = 0; // UNDOABLE_* values
	this.undoable_assets = null;
	this.program_mode = 0;
	this.ip = 0;
	this.pushed = 0;
	this.pushed_cplx_exception = 0;
	this.gtoxx = "";
	this.modifier = 0;
	this.do_fincalc = 0;
	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;
	this.error_in_display = 0;

	this.call_stack = []; // not-12C

	if (H.type === '11c') {
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 
			  'decimals', 'comma', 'index',
			  'trigo', 'user', 'notation'];
		this.nvAN = ['stomemory', 'flags'];
	} else if (H.type === '15c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
                            'xi', 'yi', 'zi', 'wi', 'last_xi',
                            'xh', 'yh', 'zh', 'wh', 'last_xh',
			  'decimals', 'comma', 'index', 'indexh',
			  'trigo', 'user', 'notation', 'complex',
			  'mR'];
		this.nvAN = ['stomemory', 'flags',
				'mA', 'mB', 'mC', 'mD', 'mE',
				'msA', 'msB', 'msC', 'msD', 'msE'];
	} else if (H.type === '16c') {
		this.nvN = ['x',  'y',  'z',  'w',  'last_x',
			    'xh', 'yh', 'zh', 'wh', 'last_xh',
			  'decimals', 'comma', 'index', 'notation',
			  'wordsize', 'intwindow', 'negative_repr',
			'altdisplay'];
		this.nvAN = ['stomemory', 'stomemoryh', 'flags'];
	} else {
		// 12C
		this.nvN = ['x', 'y', 'z', 'w', 'last_x', 'algmode',
				'decimals', 'comma', 'begin',
				'dmy', 'compoundf', 'notation'];
		this.nvAN = ['stomemory', 'finmemory', 'njmemory'];
	}
	this.nvAX = ['ram'];
};

Hp12c_machine.prototype.sto_Reset = function (i)
{
	this.stomemory[i] = 0;
	this.stomemoryh[i] = 0;
};

Hp12c_machine.prototype.reg_Reset = function (n)
{
	this[n] = 0;
	this[n + "h"] = 0;
	this[n + "i"] = 0;
};

Hp12c_machine.prototype.sto_Swap_reg = function (i, n)
{
	var tr = {r: this.stomemory[i], h: this.stomemoryh[i]};
	var ts = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(tr);
		this.cast_wordsize(ts);
	}

	this.stomemory[i] = ts.r;
	if (H.type === "16c") {
		this.stomemoryh[i] = ts.h;
	} else {
		this.stomemoryh[i] = 0;
	}
	this[n] = tr.r;
	this[n + "h"] = tr.h;
};

Hp12c_machine.prototype.sto_To_reg = function (i, n)
{
	var t = {r: this.stomemory[i], h: this.stomemoryh[i]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	// STO does not have imaginary part
	this[n] = t.r;
	this[n + "h"] = t.h; // 16C integer
};

Hp12c_machine.prototype.reg_To_sto = function (n, i)
{
	var t = {r: this[n], h: this[n + "h"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	// imaginary part not considered
	this.stomemory[i] = t.r;
	if (H.type === "16c") {
		// 15c matrixes don't go into STO
		this.stomemoryh[i] = t.h;
	} else {
		this.stomemoryh[i] = 0;
	}
};

Hp12c_machine.prototype.reg_To_reg = function (nf, nt)
{
	var t = {r: this[nf], h: this[nf + "h"], i: this[nf + "i"]};

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	this[nt] = t.r;
	this[nt + "h"] = t.h;
	this[nt + "i"] = t.i;
};

Hp12c_machine.prototype.reg_tuple = function (n)
{
	var t = {};
	t.r = this[n];
	t.i = this[n + "i"];
	t.h = this[n + "h"];

	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		// this has also the side effect of casting to int
		this.cast_wordsize(t);
	}

	return t;
};

Hp12c_machine.prototype.reg_real = function (n)
{
	return this.reg_tuple(n).r;
};

Hp12c_machine.prototype.cast_wordsize = function (t)
{
	H.cast_wordsize(t, this.wordsize);
};

Hp12c_machine.prototype.cast_wordsize_in_accumulators = function ()
{
	var i;
	var regs = ["x", "y", "z", "w", "last_x"];

	for (i = 0; i < regs.length; ++i) {
		// getter and setter cast to wordsize, so no need to
		// do that explicitly
		this.reg_Set_tuple(regs[i], this.reg_tuple(regs[i]));
	}

	// storage is not cast immediately. If the user goes back
	// to bigger wordsize he should get the original values.
	/*
	for (i = 0; i < this.sto_mem_len(); ++i) {
		this.sto_Set_tuple(i, this.sto_tuple(i));
	}
	*/
};

Hp12c_machine.prototype.reg_Set_tuple = function (n, t)
{
	if (this.notation >= H.NOTATION_INT) {
		// yes, this is right
		this.cast_wordsize(t);
	}

	this[n] = t.r;
	this[n + "i"] = t.i;
	this[n + "h"] = t.h;
};

Hp12c_machine.prototype.reg_Set_real = function (n, v)
{
	// check clients
	return this.reg_Set_tuple(n, {r: v, i: 0, h: 0});
};

Hp12c_machine.prototype.reg_Set_real_only = function (n, v)
{
	if (H.type === "15c" && this.is_complex_mode()) {
		return this.reg_Set_tuple(n, {r: v, i: this.xi, h: 0});
	}
	
	return this.reg_Set_real(n, v);
};

Hp12c_machine.prototype.sto_tuple = function (i)
{
	var t = {};
	t.r = this.stomemory[i];
	t.h = this.stomemoryh[i];
	t.i = 0; // filler to make it compatible with reg tuple

	if (this.notation >= H.NOTATION_INT) {
		this.cast_wordsize(t);
	}

	return t;
};

Hp12c_machine.prototype.sto_Set_tuple = function (i, t)
{
	if (this.notation >= H.NOTATION_INT) {
		this.cast_wordsize(t);
	}

	this.stomemory[i] = t.r;
	this.stomemoryh[i] = ((H.type === "16c") ? t.h : 0);
	// t.i not used
};

Hp12c_machine.prototype.sto_mem_ref = function ()
{
	// Used by floating-point functions only, so this is ok
	return this.stomemory;
};

Hp12c_machine.prototype.sto_mem_len = function ()
{
	return this.stomemory.length;
};

Hp12c_machine.prototype.program_limit = function ()
{
	if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
		return Math.min(H.ram_MAX - 1, this.program_size - 1);
	}
	return H.ram_MAX - 1;
};

Hp12c_machine.prototype.ram_available = function ()
{
	if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
		return Math.min(H.ram_MAX - this.program_size);
	}
	return H.ram_MAX - 1;
};

Hp12c_machine.prototype.incr_ip = function (delta)
{
	// do not allow to go above program limit, but do not zero
	// because if in RUNNING mode, pgrm module always increases IP.
	// If we make ip=0, pgrm does ++ip and then we have an
	// infinite loop.
	this.ip = Math.max(0, Math.min(this.program_limit(), this.ip + delta));
};

/* Called when H.display is already in place */
Hp12c_machine.prototype.init = function ()
{
	this.init_memory();
	this.clear_prog(1);
	this.do_clear_reg(); // implies reg, sto, fin
	this.clear_stack();
	this.error_in_display = 0;
};

Hp12c_machine.prototype.clear_fin = function ()
{
	var e;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_FIN;
		this.undoable_assets = [];
		for (e = 0; e < 5; ++e) {
			this.undoable_assets[e] = this.finmemory[e];
		}
		this.display_undo();
	}

	this.do_clear_fin();
};

Hp12c_machine.prototype.do_clear_fin = function ()
{
	for (var e = 0; e < 5; ++e) {
		this.finmemory[e] = 0;
	}
	this.display_result();
};

Hp12c_machine.prototype.clear_statistics = function ()
{
	var e;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_STAT;
		var d = {};
		this.undoable_assets = d;
		d.stack = {};
		d.stack.x = this.reg_real("x");
		d.stack.y = this.reg_real("y");
		d.stack.z = this.reg_real("z");
		d.stack.w = this.reg_real("w");
		d.sto = [];
		for (e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
			d.sto[e] = this.sto_tuple(e);
		}
		this.display_undo();
	}

	// statistics share memory with STO memory
	for (e = H.STAT_MIN; e <= H.STAT_MAX; ++e) {
		this.sto_Reset(e);
	}
	this.reg_Reset("x");
	this.reg_Reset("y");
	this.reg_Reset("z");
	this.reg_Reset("w");
	this.display_result();
};

Hp12c_machine.prototype.clear_prog = function (in_pgrm)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	if (in_pgrm) {
		this.ram[0] = "";
		for (var e = 1; e < H.ram_MAX; ++e) {
			this.ram[e] = H.STOP_INSTRUCTION;
		}
		this.program_size = 1; // for STOP in [0]
	} else {
		this.display_result();
	}
	this.ip = 0;
};

Hp12c_machine.prototype.clear_sto = function ()
{
	for (var e = 0; e < H.MEM_MAX; ++e) {
		this.sto_Reset(e);
		this.njmemory[e] = 1; // position 0 is read-only and always returns 1.
	}
};

Hp12c_machine.prototype.cli = function (motive)
{
	this.sti_level--;
	// console.log("cli " + this.sti_level + " " + motive);
	// this is cumulative i.e. two calls to cli(x) must be
	// counterbalanced by two sti(x)'s
	if (this.sti_level === 0) {
		H.keyboard.disable();
	}
};

Hp12c_machine.prototype.sti = function (motive)
{
	this.sti_level++;
	// console.log("sti " + this.sti_level + " " + motive);
	if (this.sti_level === 1) {
		H.keyboard.enable();
	}
};

Hp12c_machine.prototype.clear_typing = function ()
{
	this.xmode = -1;
	this.typed_mantissa = "";
	this.typed_decimals = "";
	this.typed_mantissa_signal = 1;
	this.typed_exponent = "00";
	this.typed_exponent_signal = 1;
};

Hp12c_machine.prototype.display_result = function ()
{
	this.display_result_s(true, true);
};

Hp12c_machine.prototype.display_result_s = function (reset_window, enable_pushed)
{
	if (H.type === "16c") {
		if (reset_window) {
			if (this.intwindow !== 0) {
				this.intwindow = 0;
				this.display_wordstatus();
			}
		}
	}

	if (enable_pushed) {
		this.pushed = 0;
		this.pushed_cplx_exception = 0;
	}
	this.clear_typing();

	var t = this.display_result_in();

	if (H.type === "15c") {
		if (t.r >= H.value_max || t.r <= -H.value_max) {
			// make display blink
			this.set_overflow(true);
		}
	}
};

Hp12c_machine.prototype.display_result_in = function ()
{
	var t = this.reg_tuple("x");
	var matrix = this.matrix_in_reg("x");

	if (! matrix) {
		H.display.displayNumber(t);
	} else {
		var size = this.matrix_size(matrix);
		H.display.displayMatrix(matrix, size[0], size[1]);
	}

	return t;
};

Hp12c_machine.prototype.display_matrix = function (n, r, c)
{
	this.pushed = 0;
	this.pushed_cplx_exception = 0;
	this.clear_typing();
	H.display.displayMatrix(n, r, c);
};

Hp12c_machine.prototype.display_all = function ()
{
	this.display_result_in();
	this.display_modifier();
	this.display_begin();
	this.display_dmyc();
	this.display_pgrm();
	this.display_algmode();
	this.display_trigo();
	this.display_user();
	this.display_flags();
	this.display_wordstatus();
	this.display_undo();
	this.display_parentheses();
};

Hp12c_machine.prototype.pse = function ()
{
	var self = this;

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.cli("pse");
	H.defer(function () {
		// do after dispatcher clears modifier
		H.display.show_pse();
	});
	H.delay(function () {
		self.sti("pse");
		self.display_modifier();
		self.display_result_s(false, false);
	}, 1000);
};

Hp12c_machine.prototype.toggle_decimal_character = function ()
{
	if (H.type === "15c") {
		this.set_overflow(false);
	}

	this.comma = this.comma ? 0 : 1;
	this.display_result();
	H.storage.save();
	console.log("Storage saved");
};

Hp12c_machine.prototype.toggle_decimal_and_altdisplay = function ()
{
	// toggles altdisplay and comma alternatively
	if (this.altdisplay) {
		this.altdisplay = 0;
		this.display_result_s(false, false);
		this.display_wordstatus();
		H.storage.save();
	} else {
		this.altdisplay = 1;
		this.display_wordstatus();
		this.toggle_decimal_character();
	}
};

Hp12c_machine.prototype.display_result_date = function (dd)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.clear_typing();
	H.display.show(H.date_to_show(dd, this.dmy));
};

Hp12c_machine.prototype.clear_stack = function ()
{
	this.reg_Reset("x");
	this.reg_Reset("y");
	this.reg_Reset("z");
	this.reg_Reset("w");
	this.reg_Reset("last_x");
};

Hp12c_machine.prototype.clear_reg = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();

		this.undoable = this.UNDOABLE_CLEAR_REG;
		var d = {};
		this.undoable_assets = d;
		d.stack = {};
		d.stack.x = this.reg_real("x");
		d.stack.y = this.reg_real("y");
		d.stack.z = this.reg_real("z");
		d.stack.w = this.reg_real("w");
		d.stack.last_x = this.reg_real("last_x");
		d.sto = [];
		d.nj = [];
		for (var e = 0; e <= H.MEM_MAX; ++e) {
			d.sto[e] = this.sto_tuple(e);
			d.nj[e] = this.njmemory[e];
		}
		d.fin = [];
		for (e = 0; e < 5; ++e) {
			d.fin[e] = this.finmemory[e];
		}
		this.display_undo();
	}

	this.do_clear_reg();
};

Hp12c_machine.prototype.do_clear_reg = function ()
{
	if (H.type !== "11c" && H.type !== "15c" && H.type !== "16c") {
		this.clear_stack();
	}
	this.index = 0;
	this.indexh = 0;
	this.do_clear_fin();
	this.clear_sto();
	this.display_result_s(false, false);
};

// HP-12C Errors
// 0 = Division by zero, LN(negative) etc.
// 1 = STO + arith + memory position if memory position > 4
// 2 = statistics
// 3 = IRR
// 4 = Memory full (only happens in emulator when program typing reaches position 99+1)
// 5 = Composite interest
// 6 = CFj if j >= 30
// 7 = IRR
// 8 = Date

Hp12c_machine.prototype.display_pgrm = function ()
{
	H.display.show_pgrm(this.program_mode == H.PROGRAMMING,
				this.program_mode >= H.RUNNING,
				this.ip);
};

Hp12c_machine.prototype.display_trigo = function ()
{
	H.display.show_trigo(this.trigo);
};

Hp12c_machine.prototype.display_user = function ()
{
	H.display.show_user(this.user);
};

Hp12c_machine.prototype.display_algmode = function ()
{
	H.display.show_algmode(this.algmode);
};

Hp12c_machine.prototype.display_error = function (err)
{
	if (H.type == "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	H.display.show_error(err);
	this.clear_typing();
	this.error_in_display = 1;

	if (this.program_mode >= H.RUNNING) {
		// errors stop programs
		H.pgrm.stop(2);
	}
};

Hp12c_machine.prototype.reset_error = function ()
{
	this.error_in_display = 0;
	if (this.program_mode == H.INTERACTIVE) {
		this.display_result_s(false, false);
	} else if (this.program_mode == H.PROGRAMMING) {
		this.display_program_opcode();
	}
};

Hp12c_machine.prototype.display_modifier2 = function (m)
{
	H.display.show_modifier(m);
};

Hp12c_machine.prototype.display_modifier = function ()
{
	this.display_modifier2(this.modifier);
};

Hp12c_machine.prototype.display_begin = function ()
{
	H.display.show_begin(this.begin);
};

Hp12c_machine.prototype.display_carry = function ()
{
	if (H.type === "16c") {
		H.display.show_carry(this.flags[H.FLAG_CARRY]);
	}
};

Hp12c_machine.prototype.display_overflow = function ()
{
	if (H.type === "16c") {
		H.display.show_overflow(this.flags[H.FLAG_OVERFLOW]);
	} else if (H.type === "15c") {
		H.display.set_blink(this.flags[H.FLAG_OVERFLOW]);
	}
};

Hp12c_machine.prototype.display_complex = function ()
{
	if (H.type === "15c") {
		H.display.show_complex(this.flags[H.FLAG_COMPLEX]);
	}
};

Hp12c_machine.prototype.display_wordstatus = function ()
{
	if (H.type === "16c") {
		var st = "";
		if (this.notation >= H.NOTATION_INT && this.altdisplay) {
			st = "" + this.wordsize + ",";
			if (this.negative_repr) {
				st += this.negative_repr;
			} else {
				st += "u";
			}
			st += "<br>w=" + this.intwindow;
		}
		H.display.show_wordstatus(st);
	}
};

Hp12c_machine.prototype.display_flags = function ()
{
	this.display_carry();
	this.display_overflow();
	this.display_complex();
};

Hp12c_machine.prototype.display_undo = function ()
{
	if (H.type === "12c-platinum") {
		H.display.show_undo(this.undoable);
	}
};

Hp12c_machine.prototype.display_parentheses = function ()
{
	if (H.type === "12c-platinum") {
		var txt = "";
		if (this.algmode) {
			if (this.count_open_parentheses() > 0) {
				txt = "( )";
			} else if (this.algebra.length > 0) {
				txt = "..";
			}
		}
		H.display.show_parentheses(txt);
	}
};

Hp12c_machine.prototype.display_dmyc = function ()
{
	H.display.show_dmyc(this.dmy, this.compoundf);
};

Hp12c_machine.prototype.set_dmy = function (v)
{
	this.dmy = v;
	this.display_dmyc();
	this.display_result();
};

Hp12c_machine.prototype.set_trigo = function (v)
{
	this.trigo = v;
	this.display_trigo();
	this.display_result();
};

Hp12c_machine.prototype.rpn_mode = function ()
{
	this.algmode = 0;
	this.algebra = [];
	this.display_parentheses();
	this.display_algmode();
	this.display_result();
};

Hp12c_machine.prototype.toggle_compoundf = function ()
{
	this.compoundf = this.compoundf ? 0 : 1;
	this.display_dmyc();
	this.display_result();
};

Hp12c_machine.prototype.toggle_user = function ()
{
	this.user = this.user ? 0 : 1;
	this.display_user();
	if (this.program_mode == H.INTERACTIVE) {
		this.display_result();
	}
};

Hp12c_machine.prototype.set_begin = function (v)
{
	this.begin = v;
	this.display_begin();
	this.display_result();
};

Hp12c_machine.prototype.set_modifier = function (v)
{
	this.modifier = v;
	if (v == H.GTO || v == H.GTO_MOVE) {
		// clean gto nn buffer on edge
		this.gto_buf_clear();
	}
	this.display_modifier();
};

Hp12c_machine.prototype.set_decimals = function (d, notation)
{
	var enable_push = false;
	if (this.notation >= H.NOTATION_INT) {
		// 16C case
		this.prepare_for_float_mode();
		this.enable_push = true;
	}
	this.notation = notation;
	this.decimals = d;
	this.display_wordstatus();
	this.display_result_s(true, enable_push);
};

Hp12c_machine.prototype.set_decimals_exponential = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		this.prepare_for_float_mode();
		this.intwindow = 0;
	}
	this.notation = H.NOTATION_SCI;
	this.decimals = 10;
	this.display_wordstatus();
	this.display_result();
};

Hp12c_machine.prototype.rst_modifier = function (df)
{
	if (df) {
		this.do_fincalc = 0;   // disarms financial calculation 
	}
	this.modifier = 0;
	this.display_modifier();
};

Hp12c_machine.prototype.push = function ()
{
	this.reg_To_reg("z", "w");
	this.reg_To_reg("y", "z");
	this.reg_To_reg("x", "y");
	this.pushed = 1;
};

Hp12c_machine.prototype.digit_add_chk_int = function (digit, typed)
{
	var digit_bits = H.digit_bits[this.notation];
	var max_digits = Math.ceil(this.wordsize / digit_bits);

	if (typed.length >= max_digits) {
		// all allowable digits typed 
		digit = null;
	}

	if (digit !== null) {
		digit = digit.toString(16);
	}

	return digit;
};

Hp12c_machine.prototype.chk_int_overflow = function (typed)
{
	var digit_bits = H.digit_bits[this.notation];
	var max_digits = this.wordsize / digit_bits;
	var max_digits_c = Math.ceil(max_digits);
	var max_digits_f = Math.floor(max_digits);

	if ((typed.length >= max_digits_c) && (max_digits_c !== max_digits_f)) {
		// test if MSB digit "splits" ie. has more bits than there
		// are bits still allowed by the word size. In this case,
		// MSB digit is cast to zero.

		// A simple bit count is not ok because in radix=10 every bit
		// depends on all digits, so it is not practical to detect overflow
		// based on the fact that 1 decimal digit ~= 3.3 bits

		var radix = H.radix[this.notation];
		var x1 = H.string_to_integer(typed, this.negative_repr,
						this.wordsize, radix);
		var x2 = H.string_to_integer(typed, this.negative_repr,
						this.wordsize + digit_bits,
						radix);
		if (x1.r !== x2.r || x1.h !== x2.h) {
			typed = "0" + typed.substr(1);
		}
	}

	return typed;
};

Hp12c_machine.prototype.digit_add = function (d)
{
	var radix = H.radix[this.notation] || 10;

	if (d >= radix) {
		return;
	}

	if (H.type === "12c-platinum") {
		if (this.undoable > this.UNDOABLE_NONE) {
			this.undoable = this.UNDOABLE_NONE;
			this.undoable_assets = null;
			this.display_undo();
		}
	}

	if (this.xmode == -1) {
		if (this.notation >= H.NOTATION_INT) {
			d = this.digit_add_chk_int(d, this.typed_mantissa);
		}
		if (d !== null) {
			if (! this.pushed) {
				this.push(); // push stack when result is immediately followed by typing
			}
			// just displayed a result
			this.clear_typing();
			this.typed_mantissa = this.chk_int_overflow("" + d);
			this.xmode = 0;
		}
	} else if (this.xmode === 0) {
		if (this.notation >= H.NOTATION_INT) {
			d = this.digit_add_chk_int(d, this.typed_mantissa);
			if (d !== null) {
				this.typed_mantissa = this.chk_int_overflow(this.typed_mantissa + "" + d);
			}
		} else {
			if (this.typed_mantissa.length < H.display.display_len) {
				this.typed_mantissa += "" + d;
			}
		}
	} else if (this.xmode === 1) {
		// integer mode never reaches this branch due to decimal_point_mode
		if ((this.typed_mantissa.length + this.typed_decimals.length) < H.display.display_len) {
			this.typed_decimals += "" + d;
		}
	} else if (this.xmode === 100) {
		// integer mode never gets this branch
		this.typed_exponent = this.typed_exponent.substr(1, 1);
		this.typed_exponent += "" + d;
	}

	this.display_typing();
};

Hp12c_machine.prototype.display_typing_integer = function ()
{
	var tu = H.string_to_integer(this.typed_mantissa, this.negative_repr,
					this.wordsize, H.radix[this.notation]);
	this.reg_Set_tuple("x", tu);

	H.display.displayTypedNumber_integer(this.reg_tuple("x"), this.xmode,
						this.typed_mantissa.length);
};

Hp12c_machine.prototype.display_typing = function ()
{
	if (H.type === "16c" && this.notation >= H.NOTATION_INT) {
		this.display_typing_integer();
		return;
	}

	var x = this.typed_mantissa_signal * 
		parseFloat(this.typed_mantissa + "." + this.typed_decimals + "0") * 
		Math.pow(10, parseInt("0" + this.typed_exponent, 10) * this.typed_exponent_signal);

	if (this.pushed_cplx_exception) {
		this.reg_Set_real_only("x", x);
	} else {
		this.reg_Set_real("x", x);
	}

	H.display.displayTypedNumber(this.typed_mantissa_signal, this.typed_mantissa,
		this.typed_decimals, this.typed_exponent, this.typed_exponent_signal,
		this.xmode);
};

Hp12c_machine.prototype.digit_delete = function ()
{
	var number_signal;
	var i;

	if (H.type === "15c") {
		this.set_overflow(false);
	}

	if (this.xmode == -1) {
		if (H.type === "11c" || H.type === "15c" || H.type === "16c") {
			// backspace key actually exists in 11c/15c/16c
			var imaginary = 0;
			if (this.is_complex_mode()) {
				// preserve imaginary
				imaginary = this.xi;
			}
			this.reg_Set_tuple("x", {r: 0, h: 0, i: imaginary});

			// changes to in-place number editing
			// (does not push again when new number is typed)
			this.pushed = 1;
			this.pushed_cplx_exception = 1;

			H.display.displayNumber(this.reg_tuple("x"));
		} else {
			// does nothing
		}
		return;
	}

	if (H.type === "12c-platinum") {
		this.undoable = this.UNDOABLE_BSP_TYPING;
		var a = [];
		this.undoable_assets = a;
		a[0] = this.xmode;
		a[1] = this.typed_mantissa;
		a[2] = this.typed_decimals;
		a[3] = this.typed_exponent;
		a[4] = this.typed_mantissa_signal;
		a[5] = this.typed_exponent_signal;
		this.display_undo();
	}

	if (this.xmode === 0) {
		i = this.typed_mantissa.length - 1;
		if (i >= 0) {
			this.typed_mantissa = this.typed_mantissa.substr(0, i);
		}
	} else if (this.xmode === 1) {
		i = this.typed_decimals.length - 1;
		if (i < 0) {
			// decimal point mode but no decimal typed
			this.xmode = 0;
		} else {
			this.typed_decimals = this.typed_decimals.substr(0, i);
		}
	} else if (this.xmode === 100) {
		this.typed_exponent = "";
		if (this.typed_decimals.length > 0) {
			this.xmode = 1;
		} else {
			this.xmode = 0;
		}
	}

	this.display_typing();
};

Hp12c_machine.prototype.input_exponential = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	if (this.xmode == -1) {
		if (! this.pushed) {
			this.push(); // push stack when result is immediately followed by typing
		}
		this.clear_typing();
		this.typed_mantissa = "1";

	} else if (this.xmode != 100) {
		if (this.typed_mantissa.length > (H.display.display_len - 3)) {
			// too long; refuse
			return;
		}

		if (parseInt("0" + this.typed_mantissa, 10) === 0) {
			// no integer part

			this.typed_mantissa = "0";

			var val_dec = parseInt("0" + this.typed_decimals, 10);

			if (val_dec === 0) {
				// both integer and decimal parts all zero
				this.typed_mantissa = "1";
			} else {
				// test for irreductible decimals like 0.000000001
				var n_dec = val_dec.toFixed(0);
				var zeros = this.typed_decimals.length - ("" + n_dec).length;

				// if no decimal typed yet, zeros gets -1
				zeros = Math.max(0, zeros);
			
				if ((this.typed_mantissa.length + zeros) >=
						(H.display.display_len - 3)) {
					// too long; refuse
					return;
				}
			}
		}
	}

	this.xmode = 100;
	this.display_typing();
};

Hp12c_machine.prototype.decimal_point_mode = function ()
{
	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	if (this.xmode == -1) {
		// just displayed a result
		if (! this.pushed) {
			this.push(); // push stack when result is immediately followed by typing
		}
		this.clear_typing();
	}

	if (this.typed_mantissa.length <= 0) {
		this.typed_mantissa = "0";
	}

	this.xmode = 1;
	this.display_typing();
};

Hp12c_machine.prototype.chs_integer = function ()
{
	// CHS always goes to result mode
	this.save_lastx();
	var xt = this.reg_tuple("x");
	var calc = H.integer_inv([xt.h, xt.r], this.negative_repr, this.wordsize);
	this.reg_Set_tuple("x", calc.result);
	this.set_overflow(calc.overflow);
	this.display_result();
};

Hp12c_machine.prototype.chs = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_chs();
		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		this.chs_integer();
		return;
	}

	if (this.xmode === -1) {
		if (this.is_complex_mode()) {
			this.reg_Set_real_only("x", -this.reg_real("x"));
		} else {
			this.reg_Set_real("x", -this.reg_real("x"));
		}
		this.display_result();
		return;
	}

	if (this.xmode == 100) {
		// input mode, inputting exponential
		this.typed_exponent_signal *= -1;
	} else {
		this.typed_mantissa_signal *= -1;
	}

	this.display_typing();
};

Hp12c_machine.prototype.pop = function ()
{
	this.reg_To_reg("y", "x");
	this.reg_To_reg("z", "y");
	this.reg_To_reg("w", "z");
};

Hp12c_machine.prototype.save_lastx = function ()
{
	if (! this.algmode) {
		this.reg_To_reg("x", "last_x");
	}
};

Hp12c_machine.prototype.lstx = function ()
{
	this.push();
	this.reg_To_reg("last_x", "x");
	this.display_result();
};

Hp12c_machine.prototype.shv = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.push();
	if (this.notation >= H.NOTATION_INT) {
		this.reg_Set_real("x", H.sve * 10);
	} else {
		this.reg_Set_real("x", H.sve);
	}
	this.display_result();
};

Hp12c_machine.prototype.apocryphal = function (i)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	// to be overridden as necessary; this is here just for testing
	this.push();
	this.reg_Set_real("x", 140 + i);
	this.display_result();
};

Hp12c_machine.prototype.clear_prefix = function ()
{
	var self = this;

	if (this.notation >= H.NOTATION_INT) {
		return;	
	}

	if (H.type == "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var n = Math.abs(this.reg_real("x"));
	var order = Math.log(n) / Math.log(10);

	if (H.badnumber(order)) {
		// tends to zero
		order = 1;
	}

	if (order == Math.floor(order)) {
		order += 0.1;
	}

	n = n * Math.pow(10, H.display.display_len - Math.ceil(order));

	this.cli("clear_prefix");

	H.display.show(H.zeropad(n.toFixed(0), H.display.display_len));

	H.delay(function () {
		self.sti("clear_prefix");
		self.display_result_s(false, false);
	}, 1000);
};

Hp12c_machine.prototype.x_exchange_y = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("y", "x");
	this.reg_Set_tuple("y", tmp);
	this.display_result();
};

Hp12c_machine.prototype.fix_index = function ()
{
	this.indexh = 0;
	var index = Math.floor(Math.abs(this.index));
	if (index >= H.MEM_MAX) {
		this.display_error(H.ERROR_INDEX);
		return null;
	}
	return index;
};

Hp12c_machine.prototype.x_exchange_index = function ()
{
	var self = this;

	if (self.matrix_in_index()) {
		self.x_exchange_matrix_index();
		return;
	}

	var index = self.fix_index();

	if (index === null) {
		return;
	}

	self.sto_Swap_reg(index, "x");
	self.display_result();
};

Hp12c_machine.prototype.x_exchange_for = function (mem_position)
{
	this.sto_Swap_reg(mem_position, "x");
	this.display_result();
};

Hp12c_machine.prototype.x_exchange_index_itself = function ()
{
	// (reg_Set_real calls reg_Set_tuple which casts an eventual
	// float index to integer.)

	var tmp = this.reg_tuple("x");
	this.reg_Set_tuple("x", {r: this.index, h: this.indexh, i: 0});
	this.index = tmp.r;
	this.indexh = tmp.h;
	this.display_result();
};

Hp12c_machine.prototype.mem_info = function ()
{
	H.display.display_meminfo(this.ram_available(), this.sto_mem_len());
	this.error_in_display = 1;
};

Hp12c_machine.prototype.sf = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.do_sf(i);
	this.display_result();
};

Hp12c_machine.prototype.do_sf = function (i)
{
	this.flags[i] = 1;
	this.display_flags();
};

Hp12c_machine.prototype.cf = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.do_cf(i);
	this.display_result();
};

Hp12c_machine.prototype.do_cf = function (i)
{
	this.flags[i] = 0;

	if (H.type === "15c") {
		if (i === H.FLAG_COMPLEX) {
			this.xi = this.yi = this.zi = this.wi = this.last_xi = 0;
		}
	}

	this.display_flags();
};

Hp12c_machine.prototype.f_question = function (i)
{
	if (i >= this.flags.length) {
		this.display_error(H.ERROR_FLAG);
		return;
	}

	this.incr_ip(this.flags[i] ? 0 : 1);
};

Hp12c_machine.prototype.dissect_word = function (word)
{
	var sgn = H.binary_sgn(word);
	var index = H.cl5_round(Math.abs(word), 5);
	var counter = Math.floor(index) * sgn;
	index -= sgn * counter;
	index *= 1000;
	var cmp = Math.floor(index + 0.001);
	index = Math.max(0, index - cmp);
	index *= 100;
	var incr = Math.floor(index + 0.1);
	return [counter, cmp, incr];
};

Hp12c_machine.prototype.update_word = function (counter, cmp, incr)
{
	var sgn = H.binary_sgn(counter);
	counter = Math.abs(counter);
	return sgn * (counter + cmp / 1000 + incr / 100000);
};

Hp12c_machine.prototype.isg_core = function (word)
{
	var res = this.dissect_word(word);
	var counter = res[0], cmp = res[1], incr = res[2];

	counter += (incr === 0 ? 1 : incr);
	this.incr_ip(counter > cmp ? 1 : 0);
	return this.update_word(counter, cmp, incr);
};

Hp12c_machine.prototype.f_isg = function ()
{
	var word = this.isg_core(this.index);
	this.index = word;
	this.indexh = 0;
};

Hp12c_machine.prototype.dse_core = function (word)
{
	var res = this.dissect_word(word);
	var counter = res[0], cmp = res[1], incr = res[2];

	counter -= (incr === 0 ? 1 : incr);
	// note that cmp >= 0; a negative counter means this is always True
	this.incr_ip(counter <= cmp ? 1 : 0);
	return this.update_word(counter, cmp, incr);
};

Hp12c_machine.prototype.f_dse = function ()
{
	var word = this.dse_core(this.index);
	this.index = word;
	this.indexh = 0;
};

Hp12c_machine.prototype.r_down = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("y", "x");
	this.reg_To_reg("z", "y");
	this.reg_To_reg("w", "z");
	this.reg_Set_tuple("w", tmp);
	this.display_result();
};

Hp12c_machine.prototype.r_up = function ()
{
	var tmp = this.reg_tuple("x");
	this.reg_To_reg("w", "x");
	this.reg_To_reg("z", "w");
	this.reg_To_reg("y", "z");
	this.reg_Set_tuple("y", tmp);
	this.display_result();
};

Hp12c_machine.prototype.clx = function ()
{
	if (H.type === "12c-platinum") {
		if (this.undoable > this.UNDOABLE_NONE) {
			// CLx in this situation wipes undo possibility
			this.undoable = this.UNDOABLE_NONE;
			this.undoable_assets = null;
		} else {
			this.undoable = this.UNDOABLE_CLX;
			this.undoable_assets = this.reg_real("x");
		}
		this.display_undo();
	}

	if (this.is_complex_mode()) {
		this.reg_Set_real_only("x", 0);
	} else {
		this.reg_Reset("x");
	}

	this.display_result();
	this.pushed = 1; // do not push if user retries typing
	this.pushed_cplx_exception = 1;
};

Hp12c_machine.prototype.finish_arithmetic = function (res, a, b)
{
	if (H.type === "16c") {
		var over = Math.abs(res) > H.value_max;
		this.set_overflow(over);
	}

	this.save_lastx();
	this.pop();
	this.reg_Set_real("x", H.arithmetic_round(res, a, b));
	this.display_result();
};

Hp12c_machine.prototype.finish_arithmetic_complex = function (res, a, b)
{
	this.save_lastx();
	this.pop();
	var tuple = {"r": H.arithmetic_round(res.r, a.r, b.r),
		     "i": H.arithmetic_round(res.i, a.i, b.i),
		     "h": 0};
	this.reg_Set_tuple("x", tuple);
	this.display_result();
};

Hp12c_machine.prototype.finish_arithmetic_int = function (calc)
{
	this.save_lastx();
	this.pop();
	this.set_carry(calc.carry);
	this.set_overflow(calc.overflow);
	this.reg_Set_tuple("x", calc.result);
	this.display_result();
};

Hp12c_machine.prototype.enter = function (g_modifier)
{
	if (this.algmode) {
		if (this.algebra.length > 0) {
			// pending op, do not push
			this.alg_resolve(1);
		} else if (! g_modifier) {
			this.push();
			this.display_result();
			this.pushed = 1;
		} else {
			// =, but nothing to solve, do not push
			this.display_result();
		}
	} else {
		this.push();
		this.display_result();
		this.pushed = 1; // already pushed, do not push twice when user types new number
	}
};

Hp12c_machine.prototype.plus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_plus();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_plus([x.h, x.r], [y.h, y.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("+");
		console.log("[+] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_plus(x, y);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y + x, x, y);
	}
};

Hp12c_machine.prototype.minus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_minus();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_minus([y.h, y.r], [x.h, x.r],
						this.negative_repr, this.wordsize);
		this.finish_arithmetic_int(calc);
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("-");
		console.log("[-] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_minus(y, x);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y - x, x, y);
	}
};

Hp12c_machine.prototype.multiply = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_multiply();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_multiply([x.h, x.r], [y.h, y.r],
				this.negative_repr, this.wordsize);
		// make sure multiplication does not change carry
		calc.carry = this.get_carry();
		this.finish_arithmetic_int(calc);
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("*");
		console.log("[*] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_multiply(x, y);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		x = this.reg_real("x");
		y = this.reg_real("y");
		this.finish_arithmetic(y * x, 0, 0);
	}
};

Hp12c_machine.prototype.divide = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.matrix_divide();
		return;
	}

	var x, y, calc;

	if (this.notation >= H.NOTATION_INT) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.integer_divide([y.h, y.r], [x.h, x.r],
				this.negative_repr, this.wordsize,
				false);
		if (calc.overflow) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			calc.result = calc.result[0];
			this.finish_arithmetic_int(calc);
		}
		return;
	} else if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("/");
		console.log("[/] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		x = this.reg_tuple("x");
		y = this.reg_tuple("y");
		calc = H.complex_divide(y, x);
		this.finish_arithmetic_complex(calc, x, y);
	} else {
		calc = this.reg_real("y") / this.reg_real("x");
		if (H.badnumber(calc)) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic(calc, 0, 0);
		}
	}
};

Hp12c_machine.prototype.poweryx = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.algmode) {
		if (! this.alg_resolve(0)) {
			return;
		}
		if (! this.algebra_rightmost_is_number()) {
			this.algebra.push(this.reg_real("x"));
		}
		this.algebra.push("^");
		console.log("[^] " + this.algebra.join(" "));
		this.display_parentheses();
		this.push();
		this.display_result();
	} else if (this.is_complex_mode()) {
		var x = this.reg_tuple("x");
		var y = this.reg_tuple("y");
		var calc = H.complex_power(y, x);
		if (calc.err) {
			console.log("complex power err");
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic_complex(calc, x, y);
		}
	} else {
		var res = Math.pow(this.reg_real("y"), this.reg_real("x"));
		if (H.badnumber(res)) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.finish_arithmetic(res, 0, 0);
		}
	}
};

Hp12c_machine.prototype.power10 = function ()
{ 
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_power10(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// can be big but not NaN
	var res = H.clamp(Math.pow(10.0, this.reg_real("x")));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.reciprocal = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_reciprocal();
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_reciprocal(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		// no-op in 16C integer mode
		return;
	}

	var res = 1 / this.reg_real("x");
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.square = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_square(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	// can overflow but is never NaN
	var res = H.clamp(Math.pow(this.reg_real("x"), 2));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.sqroot = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_sqrt(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		var xt = this.reg_tuple("x");
		var calc = H.integer_sqrt([xt.h, xt.r],
						this.negative_repr,
						this.wordsize);
		if (calc.overflow) {
			this.display_error(H.ERROR_DIVZERO);
		} else {
			this.save_lastx();
			this.reg_Set_tuple("x", calc.result);
			this.set_carry(calc.carry);
			this.display_result();
		}
		return;
	}

	var res = Math.sqrt(this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.exp = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		// can't fail
		var cres = H.complex_exp(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// can't be NaN
	var res = H.clamp(Math.exp(this.reg_real("x")));
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.ln = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_ln(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math.log(this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.log10 = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_log10(this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math.log(this.reg_real("x")) / Math.log(10);
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.trig = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			// only tan can yield error, due to our implementation
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = H[f](H.radians(this.reg_real("x"), this.trigo));
	// sin, cos, tan can't yield NaN
	res = H.clamp(res);

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.triginv = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = Math[f](this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", H.to_angle_mode(res, this.trigo));
		this.display_result();
	}
};

Hp12c_machine.prototype.htrig = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	// hyperbolic sin/cos/tan can't yield NaN
	var res = H[f].call(null, this.reg_real("x"));
	res = H.clamp(res);

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.htriginv = function (f)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var name = "complex_" + f;
		var cres = H[name](this.reg_tuple("x"));
		if (cres.err) {
			this.display_error(H.ERROR_DIVZERO);
			return;
		}
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();

		return;
	}

	var res = H[f].call(null, this.reg_real("x"));
	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.intg = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", Math.floor(Math.abs(this.reg_real("x"))) *
				H.binary_sgn(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.abs_integer = function ()
{
	// CHS always goes to result mode
	var xt = this.reg_tuple("x");
	var calc = H.integer_abs([xt.h, xt.r], this.negative_repr, this.wordsize);

	this.save_lastx();
	this.reg_Set_tuple("x", calc.result);
	this.set_overflow(calc.overflow);
	this.display_result();
};

Hp12c_machine.prototype.abs = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_abs(this.reg_tuple("x"));
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	if (this.notation >= H.NOTATION_INT) {
		this.abs_integer();
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", Math.abs(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_radians = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.degrees_to_radians(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_degrees = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.radians_to_degrees(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hms = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.hour_to_hms(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.to_hour = function () 
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.hms_to_hour(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.pi = function ()
{
	this.push();
	this.reg_Set_real("x", Math.PI);
	this.display_result();
};

Hp12c_machine.prototype.random = function ()
{
	this.push();
	this.reg_Set_real("x", this.prng.random());
	this.display_result();
};

Hp12c_machine.prototype.random_sto = function ()
{
	var seed = this.reg_real("x");
	this.prng = new H.Prng(seed);
	this.display_result();
};

Hp12c_machine.prototype.random_rcl = function ()
{
	this.reg_Set_real("x", this.prng.getSeed());
	this.display_result();
};

Hp12c_machine.prototype.rnd = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", H.cl5_round(this.reg_real("x"), this.decimals));
	this.display_result();
};

Hp12c_machine.prototype.polar = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var cres = H.complex_to_polar(this.reg_tuple("x"));
		cres.i = H.to_angle_mode(cres.i, this.trigo);
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	var res = H.polar(this.reg_real("x"), this.reg_real("y"));
	// H.polar can't throw NaN
	var r = H.clamp(res[0]);
	var angle = res[1];

	this.save_lastx();
	this.reg_Set_real("x", r);
	this.reg_Set_real("y", H.to_angle_mode(angle, this.trigo));
	this.display_result();
};

Hp12c_machine.prototype.orthogonal = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (this.is_complex_mode()) {
		var arg = this.reg_tuple("x");
		arg.i = H.radians(arg.i, this.trigo);
		var cres = H.complex_to_cartesian(arg);
		this.save_lastx();
		this.reg_Set_tuple("x", cres);
		this.display_result();
		return;
	}

	var r = this.reg_real("x");
	var angle = H.radians(this.reg_real("y"), this.trigo);
	var res = H.orthogonal(r, angle);
	// H.orthogonal can't throw NaN
	var x = H.clamp(res[0]);
	var y = H.clamp(res[1]);

	this.save_lastx();
	this.reg_Set_real("x", x);
	this.reg_Set_real("y", y);
	this.display_result();
};

Hp12c_machine.prototype.fatorial = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if ((H.type !== "11c" && H.type !== "15c" && H.type !== "16c") &&
			(this.reg_real("x") < 0 ||
				this.reg_real("x") !=
					Math.floor(this.reg_real("x")))) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	if (this.reg_real("x") > 69.95) {
		this.save_lastx();
		this.reg_Set_real("x", H.value_max);
		this.display_result();
		return;
	}

	var res;

	if (H.type === "11c" || H.type === "15c") {
		res = H.fatorial_gamma(this.reg_real("x"));
	} else {
		res = H.fatorial(this.reg_real("x"));
	}

	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.frac = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	this.save_lastx();
	this.reg_Set_real("x", (Math.abs(this.reg_real("x")) -
				Math.floor(Math.abs(this.reg_real("x")))) *
					H.binary_sgn(this.reg_real("x")));
	this.display_result();
};

Hp12c_machine.prototype.percent = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	var res = this.reg_real("y") * this.reg_real("x") / 100;
	res = H.clamp(res);
	this.save_lastx();
	this.reg_Set_real("x", res);
	this.display_result();
};

Hp12c_machine.prototype.deltapercent = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	var res = 100 * (this.reg_real("x") / this.reg_real("y")) - 100;

	if (H.badnumber(res)) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.sto = function (pos)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	var res = 100 * (this.reg_real("x") / this.reg_real("y")) - 100;
	// "pos" comes correctly adjusted from dispatcher even in the
	// case of HP-16C (0..15, 16..31).
	this.reg_To_sto("x", pos);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.sto_index = function (pos)
{
	if (this.matrix_in_index()) {
		this.sto_matrix_el_i();
		return;
	}

	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.reg_To_sto("x", index);
	this.display_result_s(false, true);
};

Hp12c_machine.prototype.get_index = function ()
{
	this.push();
	this.reg_Set_tuple("x", {r: this.index, h: this.indexh, i: 0});
	this.display_result();
};

Hp12c_machine.prototype.set_index = function ()
{
	var x = this.reg_tuple("x");
	this.index = x.r;
	this.indexh = x.h;
	this.display_result();
};

Hp12c_machine.prototype.tarithmetic = function (at, bt, op)
{
	// not implemented in 16c
	var res = {};
	res.r = res.i = res.h = 0;
	if (op === "+") {
		res.r = at.r + bt.r;
	} else if (op === "-") {
		res.r = at.r - bt.r;
	} else if (op === "x") {
		res.r = at.r * bt.r;
	} else if (op === "/") {
		res.r = at.r / bt.r;
	}
	return res;
};

Hp12c_machine.prototype.stoinfix_core = function (a, operation)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return null;
	}

	var b = this.reg_tuple("x");

	if (operation ==  H.STO_PLUS) {
		a = this.tarithmetic(a, b, "+");
	} else if (operation == H.STO_MINUS) {
		a = this.tarithmetic(a, b, "-");
	} else if (operation == H.STO_TIMES) {
		a = this.tarithmetic(a, b, "x");
	} else if (operation == H.STO_DIVIDE) {
		a = this.tarithmetic(a, b, "/");
		if (H.badnumber(a.r)) {
			this.display_error(H.ERROR_DIVZERO);
			return null;
		}
	}

	a.r = H.clamp(a.r);

	return a;
};

Hp12c_machine.prototype.rcl = function (pos)
{
	this.push(); // every RCL pushes the result to stack
	this.sto_To_reg(pos, "x");
	this.display_result();
};

Hp12c_machine.prototype.rcl_index = function (pos)
{
	if (this.matrix_in_index()) {
		this.rcl_matrix_el_i();
		return;
	}

	var index = this.fix_index();

	if (index === null) {
		return;
	}

	this.push(); // every RCL pushes the result to stack
	this.sto_To_reg(index, "x");
	this.display_result();
};

Hp12c_machine.prototype.stat_sigma_rcl = function ()
{
	this.push();
	this.push();
	this.sto_To_reg(H.STAT_X, "x");
	this.sto_To_reg(H.STAT_Y, "y");
	this.display_result();
};

Hp12c_machine.prototype.stat_sigma_plus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	H.stat_accumulate(+1, this.sto_mem_ref(), this.reg_real("x"), this.reg_real("y"));
	this.save_lastx();
	this.sto_To_reg(H.STAT_N, "x");
	this.display_result();
	this.pushed = 1;
};

Hp12c_machine.prototype.stat_sigma_minus = function ()
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! this.alg_resolve(1)) {
		return;
	}

	H.stat_accumulate(-1, this.sto_mem_ref(), this.reg_real("x"), this.reg_real("y"));
	this.save_lastx();
	this.sto_To_reg(H.STAT_N, "x");
	this.display_result();
	this.pushed = 1;
};

Hp12c_machine.prototype.stat_avgw = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	// 16C does not have statistics, so this is ok
	var res = H.stat_avgw(this.sto_mem_ref());
	
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.reg_Set_real("x", res[1]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_avg = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stat_avg(this.sto_mem_ref());

	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.reg_Set_real("x", res[1]);
		this.reg_Set_real("y", res[2]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_stddev = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stddev(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
		return;
	}

	this.save_lastx();
	this.push();
	this.reg_Set_real("x", res[1]);
	this.reg_Set_real("y", res[2]);
	this.display_result();
};

Hp12c_machine.prototype.stat_lr = function (is_x)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return null;
	}

	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	var res = H.stat_kr(this.sto_mem_ref(), is_x, this.reg_real("x"));
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.reg_Set_real("x", res[1]);
		this.reg_Set_real("y", res[2]);
		this.display_result();
	}
};

Hp12c_machine.prototype.stat_linearregression = function ()
{
	// this method is called only for 11C and 15C
	/*
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}
	*/

	var res = H.linear_regression(this.sto_mem_ref());
	if (! res[0]) {
		this.display_error(H.ERROR_STAT);
	} else {
		this.save_lastx();
		this.push();
		this.push();
		this.reg_Set_real("x", res[1]); // B
		this.reg_Set_real("y", res[2]); // A
		this.display_result();
	}
};

Hp12c_machine.prototype.permutations = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_zc_zp();
		return;
	}

	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x >= 70 ||
	    y < 0 || y != Math.floor(y) || y >= 70 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.permutations(y, x);
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.combinations = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.matrix_zp_zc();
		return;
	}

	var x = this.reg_real("x");
	var y = this.reg_real("y");
	if (x < 0 || x != Math.floor(x) || x >= 70 ||
	    y < 0 || y != Math.floor(y) || y >= 70 ||
	    y < x) {
		this.display_error(H.ERROR_DIVZERO);
	} else {
		this.save_lastx();
		var res = H.combinations(y, x);
		this.pop();
		this.reg_Set_real("x", res);
		this.display_result();
	}
};

Hp12c_machine.prototype.display_program_opcode = function ()
{
	var instr = this.ram[this.ip];

	if (H.type === "16c") {
		instr = H.pgrm.hex_opcode(instr);
	} else if (H.type === "15c") {
		instr = H.pgrm.shrunk_opcode(instr);
	}

	var txt = H.zeropad(this.ip.toFixed(0), H.ram_ADDR_SIZE) +
				"-" + instr;
	H.display.show(txt);
};

Hp12c_machine.prototype.prog_pr = function ()
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	if (this.program_mode == H.INTERACTIVE) {
		this.program_mode = H.PROGRAMMING;
		// NOTE: entering programming mode does not reset instruction pointer
		// this.ip = 0;
		this.display_pgrm();
		this.display_program_opcode();
	}
};

Hp12c_machine.prototype.prog_bst_after = function ()
{
	this.sti("bst_after");
	this.display_result_s(false, false);
};

Hp12c_machine.prototype.gto_digit_add = function (n)
{
	if (H.type === "12c-platinum") {
		this.algebra = [];
		this.display_parentheses();
	}

	this.gtoxx = "" + this.gtoxx + n.toFixed(0);
	if (this.gtoxx.length >= H.ram_ADDR_SIZE) {
		var new_ip = parseInt(this.gtoxx, 10);
		this.gtoxx = "";
		this.rst_modifier(); // OK

		if (new_ip > this.program_limit()) {
			this.display_error(H.ERROR_IP);
			return;
		}

		this.ip = new_ip;
	}
};

Hp12c_machine.prototype.ntest = function (var1, criteria, var2, cplx)
{
	var1 = this.reg_tuple(var1);

	if (var2 !== "0") {
		var2 = this.reg_tuple(var2);
	} else {
		var2 = {r: 0, h: 0, i: 0};
	}

	var res;

	if (this.notation >= H.NOTATION_INT) {
		if (criteria == "==" || criteria == "=" || criteria == "===") {
			res = H.integer_eq(var1, var2, this.negative_repr, this.wordsize);
		} else if (criteria == "<=") {
			res = H.integer_le(var1, var2, this.negative_repr, this.wordsize);
		} else if (criteria == "<") {
			res = H.integer_lt(var1, var2, this.negative_repr, this.wordsize);
		}
	} else {
		if (criteria == "==" || criteria == "=" || criteria == "===") {
			res = H.feq10(var1.r, var2.r);
			if (cplx && this.is_complex_mode()) {
				res = res && H.feq10(var1.i, var2.i);
			}
		} else if (criteria == "<=") {
			res = var1.r <= var2.r;
		} else if (criteria == "<") {
			res = var1.r < var2.r;
		}
	}

	return res;
};

Hp12c_machine.prototype.test = function (condition)
{
	this.display_result_s(false, true);
	this.incr_ip(condition ? 0 : 1);
};

Hp12c_machine.prototype.test_x_le_y = function ()
{
	this.test(this.ntest("x", "<=", "y"));
};

Hp12c_machine.prototype.test_x_gt_y = function ()
{
	this.test(! this.ntest("x", "<=", "y"));
};

Hp12c_machine.prototype.test_x_eq_y = function ()
{
	this.test(this.ntest("x", "==", "y", true));
};

Hp12c_machine.prototype.test_x_ne_y = function ()
{
	this.test(! this.ntest("x", "==", "y", true));
};

Hp12c_machine.prototype.test_x_ge_y = function ()
{
	this.test(! this.ntest("x", "<", "y"));
};

Hp12c_machine.prototype.test_x_lt_y = function ()
{
	this.test(this.ntest("x", "<", "y"));
};

Hp12c_machine.prototype.test_x_less_0 = function ()
{
	this.test(this.ntest("x", "<", "0"));
};

Hp12c_machine.prototype.test_x_ge_0 = function ()
{
	this.test(! this.ntest("x", "<", "0"));
};

Hp12c_machine.prototype.test_x_gt_0 = function ()
{
	this.test(! this.ntest("x", "<=", "0"));
};

Hp12c_machine.prototype.test_x_le_0 = function ()
{
	this.test(this.ntest("x", "<=", "0"));
};

Hp12c_machine.prototype.test_x_eq0 = function ()
{
	// works for matrix since x would be a non-zero descriptor
	this.test(this.ntest("x", "==", "0", true));
};

Hp12c_machine.prototype.test_x_ne0 = function ()
{
	this.test(! this.ntest("x", "==", "0", true));
};

Hp12c_machine.prototype.gto_buf_clear = function ()
{
	this.gtoxx = "";
};

Hp12c_machine.prototype.nop = function ()
{
};

Hp12c_machine.prototype.program_stopped = function (reason)
{
	if (H.type !== "15c") {
		return;
	}

	// handles result of subroutine execution for SOLVE,
	// integration, etc.

	this.pop_running_context(reason);
};

Hp12c_machine.prototype.get_complex = function ()
{
	return this.flags[H.FLAG_COMPLEX];
};

Hp12c_machine.prototype.is_complex_mode = function ()
{
	if (H.type === "15c") {
		return this.get_complex();
	}

	return false;
};

Hp12c_machine.prototype.set_complex = function (v)
{
	if (H.type === "15c") {
		this.do_sf(H.FLAG_COMPLEX);
	}
};

Hp12c_machine.prototype.set_overflow = function (v)
{
	if (H.type === "16c" || H.type === "15c") {
		if (v) {
			this.do_sf(H.FLAG_OVERFLOW);
		} else {
			this.do_cf(H.FLAG_OVERFLOW);
		}
	}
};

Hp12c_machine.prototype.get_overflow = function ()
{
	return this.flags[H.FLAG_OVERFLOW];
};

Hp12c_machine.prototype.matrix_in_reg = function (reg)
{
	if (H.type !== "15c") {
		return 0;
	}

	var self = this;

	var x = self.reg_tuple(reg);

	if ((! x.h) || (! self.chk_matrix_number(x.r))) {
		return 0;
	}

	return x.r;
};

Hp12c_machine.prototype.matrix_in_index = function ()
{
	var self = this;

	if (H.type !== "15c") {
		return 0;
	}

	if ((! self.indexh) || (! self.chk_matrix_number(self.index))) {
		return 0;
	}

	return self.index;
};

Hp12c_machine.prototype.alg_resolve = function (close_all)
{
	if (H.type !== "12c-platinum") {
		return 1;
	}
	return this.alg_resolve_in(close_all);
};

Hp12c_machine.prototype.stoinfix = function (pos, operation)
{
	var a;
	if (pos === 99999) {
		a = {r: this.index, i: 0, h: 0};
	} else {
		a = this.sto_tuple(pos);
	}
	a = this.stoinfix_core(a, operation);

	if (a === null) {
		return;
	}

	if (pos === 99999) {
		this.index = a.r;
	} else {
		this.sto_Set_tuple(pos, a);
	}
	this.display_result();
};

Hp12c_machine.prototype.stoinfix_index = function (operation)
{
	var self = this;

	if (self.matrix_in_index()) {
		self.sto_infix_matrix_el_i(operation);
		return;
	}

	var index = this.fix_index();
 
	if (index === null) {
		return;
	}

	this.stoinfix(index, operation);
};
/*jslint white: true, undef: true, nomen: true, regexp: true, bitwise: true, strict: true, browser: true */
/*global H, Hp12c_machine */

"use strict";

Hp12c_machine.prototype.show_imaginary = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	self.cli("show_imaginary");

	H.display.displayNumber({r: self.reg_tuple("x").i, i: 0, h: 0});

	H.delay(function () {
		self.sti("show_imaginary");
		self.display_result_s(false, false);
	}, 1500);
};

Hp12c_machine.prototype.enter_complex = function ()
{
	var self = this;

	if (! self.get_complex()) {
		self.set_complex();
	}
	// x,xi = y,x
	var imaginary = self.x;
	self.pop(); // x=y
	self.xi = imaginary; // xi=x
	self.display_result();
};

Hp12c_machine.prototype.complex_re_im = function ()
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (! self.get_complex()) {
		self.set_complex();
	}
	var imaginary = self.xi;
	self.xi = self.x;
	self.x = imaginary;
	self.display_result();
};

Hp12c_machine.prototype.pop_running_context = function (stop_reason)
{
	var self = this;

	if (self.running_context.length <= 0) {
		return;
	}

	var cb = self.running_context.pop();

	H.defer(function () {
		cb(stop_reason);
	});
};

Hp12c_machine.prototype.push_running_context = function (cb)
{
	var self = this;

	self.running_context.push(cb);
};

Hp12c_machine.prototype.apply_running_context = function (stop_reason, saved_ip)
{
	var self = this;

	// remove blank context pushed by stash_running_context();
	self.pop_running_context();

	// what to do when this context regains control

	if (stop_reason === 1 || stop_reason === 2) {
		// stopped due to key or error
		// continue unrolling contexts
		self.pop_running_context(stop_reason);
		return;
	}

	// restore IP and continue to run
	H.machine.ip = saved_ip + 1;
	H.pgrm.run();
};

// save execution context when e.g.
// SOLVE is called within a program
Hp12c_machine.prototype.stash_running_context = function ()
{
	var self = this;

	var cb = function () {};

	if (self.program_mode >= H.RUNNING) {
		// in run mode, needs to save context
		// push a blank running context to keep "running" state
		// until apply_running_context() is called
		self.push_running_context(cb);

		var saved_ip = self.ip;
		cb = function (stop_reason) {
			// what to do when context is unrolled
			self.apply_running_context(stop_reason, saved_ip);
		};
	}

	self.push_running_context(cb);
};

Hp12c_machine.prototype.solve_cb = function (stop_reason)
{
	var self = this;

	if (stop_reason === 1 || stop_reason === 2) {
		// stopped by key or error
		self.solve_stop(stop_reason);
		return;
	}

	var res = self.reg_real("x");
	res = self.osolve.iterate(res);
	var st = res[0];

	if (st === 0) {
		// finished, found root
		self.solve_stop(0);
	} else if (st === 1 || st === 2) {
		if (st === 1) {
			// asked for eval
			self.reg_Set_real("x", res[1]);
			if (! H.pgrm.gosub(self.osolve.function_label)) {
				// label not found, error already in display
				console.log("solve: label does not exist");
				self.solve_stop(2);
				return;
			}
			self.push_running_context(function (stop_reason) {
				// call me back when program stops
				self.solve_cb(stop_reason);
			});
		} else {
			// simply recycle
			H.defer(function () {
				self.solve_cb(-1);
			});
		}
	} else {
		// could not find a root
		console.log("Root not found, st=" + st);
		self.display_error(H.ERROR_NO_ROOT);
		self.solve_stop(2);
	}
};

Hp12c_machine.prototype.solve_stop = function (reason)
{
	var self = this;

	H.pgrm.slow();
	self.reg_Set_real("z", self.osolve.last_fx());
	self.reg_Set_real("y", self.osolve.second_last_estim());
	self.reg_Set_real("x", self.osolve.last_estim());
	self.osolve = null;
	if (! self.error_in_display) {
		self.display_result();
	}

	self.pop_running_context(reason);
};

Hp12c_machine.prototype.solve = function (label)
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (self.osolve) {
		console.log("solve: recursive");
		self.display_error(H.ERROR_RECURSIVE_SOLVE);
		return;
	}

	self.stash_running_context();

	if (self.program_mode >= H.RUNNING) {
		// if p_execute() called, putting in interactive mode avoids IP
		// progression and rescheduling when this function returns
		self.program_mode = H.INTERACTIVE;
		// compensate increase when returning to p_execute()
		self.ip -= 1;
	}
	
	var guess0 = self.reg_real("y");
	var guess1 = self.reg_real("x");
	H.pgrm.fast();
	self.osolve = H.find_root(guess0, guess1);
	self.osolve.function_label = label;

	self.reg_Set_real("y", guess1);
	self.reg_Set_real("z", guess1);
	self.reg_Set_real("w", guess1);

	// delay execution for the case pgrm.p_execute() called us
	// we don't want to call gosub and then p_execute() does
	// the post-instruction housekeeping, breaking the sub
	// context...
	H.defer(function () {
		self.solve_cb(-1);
	});
};

Hp12c_machine.prototype.integrate_cb = function (stop_reason)
{
	var self = this;

	if (stop_reason === 1 || stop_reason === 2) {
		// stopped by key or error
		self.integrate_stop(stop_reason);
		return;
	}

	var res = self.reg_real("x");
	res = self.ointegrate.iterate(res);
	var st = res[0];

	if (st === 0) {
		// finished
		self.ointegrate.final_result = res[1];
		self.ointegrate.final_error_estim = res[2];
		self.integrate_stop(0);
	} else if (st === 1) {
		// asked for eval
		self.reg_Set_real("x", res[1]);
		if (! H.pgrm.gosub(self.ointegrate.function_label)) {
			// label not found, error already in display
			console.log("integrate: label does not exist");
			self.integrate_stop(2);
			return;
		}
		self.push_running_context(function (stop_reason) {
			// call me back when program stops
			self.integrate_cb(stop_reason);
		});
	} else {
		// simply recycle
		H.defer(function () {
			self.integrate_cb(-1);
		});
	}
};

Hp12c_machine.prototype.integrate_stop = function (reason)
{
	var self = this;

	H.pgrm.slow();

	self.reg_Set_real("x", self.ointegrate.final_result);
	self.reg_Set_real("y", self.ointegrate.final_error_estim);
	self.ointegrate = null;
	if (! self.error_in_display) {
		self.display_result();
	}

	self.pop_running_context(reason);
};

Hp12c_machine.prototype.integrate = function (label)
{
	var self = this;

	if (self.matrix_in_reg("x") || self.matrix_in_reg("y")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	if (self.ointegrate) {
		console.log("recursive integration");
		self.display_error(H.ERROR_RECURSIVE_SOLVE);
		return;
	}

	self.stash_running_context();

	if (self.program_mode >= H.RUNNING) {
		// if p_execute() called, putting in interactive mode
		// avoids rescheduling when this function returns
		self.program_mode = H.INTERACTIVE;
		// compensate increase when returning to p_execute()
		self.ip -= 1;
	}
	
	var from = self.reg_real("y");
	var to = self.reg_real("x");
	var decimals = self.decimals;

	H.pgrm.fast();
	self.ointegrate = H.adaptive_simpson(from, to, decimals);
	self.ointegrate.function_label = label;
	self.ointegrate.final_result = 0;
	self.ointegrate.final_error_estim = 0;

	// delay execution for the case pgrm.p_execute() called us
	// we don't want to call gosub and then p_execute() does
	// the post-instruction housekeeping, breaking the sub
	// context...
	H.defer(function () {
		self.integrate_cb(-1);
	});
};

Hp12c_machine.prototype.test_15c = function (n)
{
	var self = this;

	// works equally for matrixes (tests 0, 5, 6)
	// since x.r contains the matrix ID that is 20-24

	if (Hp12c_machine.prototype.test_15c.test_handlers[n]) {
		Hp12c_machine.prototype.test_15c.test_handlers[n].call(self);
	}
};

Hp12c_machine.prototype.test_15c.test_handlers = [];
var tmp = Hp12c_machine.prototype.test_15c.test_handlers;
tmp[0] = Hp12c_machine.prototype.test_x_ne0;
tmp[1] = Hp12c_machine.prototype.test_x_gt_0;
tmp[2] = Hp12c_machine.prototype.test_x_less_0;
tmp[3] = Hp12c_machine.prototype.test_x_ge_0;
tmp[4] = Hp12c_machine.prototype.test_x_le_0;
tmp[5] = Hp12c_machine.prototype.test_x_eq_y;
tmp[6] = Hp12c_machine.prototype.test_x_ne_y;
tmp[7] = Hp12c_machine.prototype.test_x_gt_y;
tmp[8] = Hp12c_machine.prototype.test_x_lt_y;
tmp[9] = Hp12c_machine.prototype.test_x_ge_y;

Hp12c_machine.prototype.chk_matrix_number = function (n)
{
	var self = this;
	var ret = n >= 20 && n <= 24 && n === Math.floor(n);
	if (! ret) {
		console.log("Value not a matrix descriptor: " + n);
	}
	return ret;
};

Hp12c_machine.prototype.matrix_mem = function (n)
{
	var self = this;
	return self["m" + (10 + (n - 20)).toString(16).toUpperCase()];
};

Hp12c_machine.prototype.matrix_mem_Set = function (n, m, s)
{
	var self = this;
	self["m" + (10 + (n - 20)).toString(16).toUpperCase()] = m.slice(0);
	self["ms" + (10 + (n - 20)).toString(16).toUpperCase()] = s.slice(0);
};

Hp12c_machine.prototype.matrix_size = function (n)
{
	var self = this;
	return self["ms" + (10 + (n - 20)).toString(16).toUpperCase()];
};

Hp12c_machine.prototype.chk_matrix_rows = function (row, n)
{
	var self = this;
	var size;
	if (n) {
		size = self.matrix_size(n);
	} else {
		size = [8, 8];
	}
	row = Math.floor(row);
	return row >= 1 && row <= size[0];
};

Hp12c_machine.prototype.chk_matrix_cols = function (col, n)
{
	var self = this;
	var size;
	if (n) {
		size = self.matrix_size(n);
	} else {
		size = [8, 8];
	}
	col = Math.floor(col);
	return col >= 1 && col <= size[1];
};

Hp12c_machine.prototype.linear_element = function (row, col, n)
{
	var self = this;
	var size = self.matrix_size(n);
	return (Math.floor(row) - 1) * self.matrix_size(n)[1] +
		(Math.floor(col) - 1);
};

Hp12c_machine.prototype.advance_matrix_coord = function (n)
{
	var self = this;
	var size = self.matrix_size(n);
	var cur_row = Math.floor(self.sto_tuple(0).r);
	var cur_col = Math.floor(self.sto_tuple(1).r);
	++cur_col;
	if (cur_col > size[1]) {
		cur_col = 1;
		++cur_row;
	}
	if (cur_row > size[0]) {
		cur_row = 1;
	}
	self.sto_Set_tuple(0, {r: cur_row, i: 0, h: 0});
	self.sto_Set_tuple(1, {r: cur_col, i: 0, h: 0});
};

Hp12c_machine.prototype.sto_matrix_el = function (n)
{
	var self = this;

	var row = self.sto_tuple(0).r;
	var col = self.sto_tuple(1).r;

	if (! self.chk_matrix_rows(row, n) ||
			! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var le = self.linear_element(row, col, n);

	self.matrix_mem(n)[le] = self.reg_real("x");
	self.display_matrix(n, row, col);

	if (self.user) {
		self.advance_matrix_coord(n);
	}
};

Hp12c_machine.prototype.sto_matrix_el_i = function ()
{
	var self = this;

	self.sto_matrix_el(self.index);
	return;
};

Hp12c_machine.prototype.sto_g_matrix_el = function (n)
{
	var self = this;

	var row = self.reg_real("y");
	var col = self.reg_real("x");

	if (! self.chk_matrix_rows(row, n) ||
			! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var le = self.linear_element(row, col, n);

	self.pop();
	self.pop();
	self.matrix_mem(n)[le] = self.reg_real("x");
	self.display_matrix(n, row, col);
};

Hp12c_machine.prototype.sto_g_matrix_el_i = function ()
{
	var self = this;

	if (! self.matrix_in_index()) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.sto_g_matrix_el(self.index);
};

Hp12c_machine.prototype.rcl_matrix_el = function (n)
{
	var self = this;

	var row = self.sto_tuple(0).r;
	var col = self.sto_tuple(1).r;

	if (! self.chk_matrix_rows(row, n) ||
			! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var le = self.linear_element(row, col, n);

	self.push();
	self.reg_Set_real("x", self.matrix_mem(n)[le]);
	self.display_result();

	if (self.user) {
		self.advance_matrix_coord(n);
	}
};

Hp12c_machine.prototype.rcl_matrix_el_i = function ()
{
	var self = this;

	self.rcl_matrix_el(self.index);
	return;
};

Hp12c_machine.prototype.rcl_g_matrix_el = function (n)
{
	var self = this;

	var row = self.reg_real("y");
	var col = self.reg_real("x");

	if (! self.chk_matrix_rows(row, n) ||
			! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var le = self.linear_element(row, col, n);

	self.pop();
	self.reg_Set_real("x", self.matrix_mem(n)[le]);
	self.display_result();
};

Hp12c_machine.prototype.rcl_g_matrix_el_i = function ()
{
	var self = this;

	if (! self.matrix_in_index()) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.rcl_g_matrix_el(self.index);
};

Hp12c_machine.prototype.x_exchange_matrix_index = function ()
{
	var self = this;
	
	self.x_exchange_matrix(self.index);
	return;
};

Hp12c_machine.prototype.x_exchange_matrix = function (n)
{
	var self = this;

	var row = Math.floor(self.sto_tuple(0).r);
	var col = Math.floor(self.sto_tuple(1).r);

	if (! self.chk_matrix_rows(row, n) || ! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = self.matrix_mem(n);
	var i = self.linear_element(row, col, n);
	var tmp = m[i];
	m[i] = self.reg_real("x");
	self.reg_Set_real("x", tmp);

	self.display_result();
};

Hp12c_machine.prototype.sto_matrix = function (n)
{
	var self = this;

	// no need to check, argument fixed from dispatch
	var from = self.matrix_in_reg("x");
	if (! from) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.matrix_mem_Set(n, self.matrix_mem(from), self.matrix_size(from));
	self.display_result();
};

Hp12c_machine.prototype.rcl_matrix = function (n)
{
	var self = this;

	// no need to check, argument fixed from dispatch
	self.push();
	self.reg_Set_tuple("x", {r: n, i: 0, h: 1});
	self.display_result();
};

Hp12c_machine.prototype.result_matrix = function (n)
{
	var self = this;

	// no need to check, argument fixed from dispatch
	self.mR = n;
	self.display_matrix(n, self.matrix_size(n)[0], self.matrix_size(n)[1]);
};

Hp12c_machine.prototype.sto_result_matrix = function ()
{
	var self = this;

	var n = self.matrix_in_reg("x");

	if (! n) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.mR = n;
	self.display_result();
};

Hp12c_machine.prototype.rcl_result_matrix = function (n)
{
	var self = this;

	self.push();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});
	self.display_result();
};

Hp12c_machine.prototype.matrix_0 = function ()
{
	var self = this;

	// matrix descriptors from A to E are 20..24
	self.matrix_mem_Set(20, [], [0, 0]);
	self.matrix_mem_Set(21, [], [0, 0]);
	self.matrix_mem_Set(22, [], [0, 0]);
	self.matrix_mem_Set(23, [], [0, 0]);
	self.matrix_mem_Set(24, [], [0, 0]);

	self.display_result();
};

Hp12c_machine.prototype.matrix_1 = function ()
{
	var self = this;

	self.sto_Set_tuple(0, {r: 1, h: 0, i: 0});
	self.sto_Set_tuple(1, {r: 1, h: 0, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_2 = function ()
{
	var self = this;

	var xn = self.matrix_in_reg("x");
	if (! xn) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}
	var x = H.matrix_from_mem(self.matrix_mem(xn), self.matrix_size(xn));

	var res = x.zp_ztilde();

	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(xn, res[0], res[1]);

	self.display_result();
};

Hp12c_machine.prototype.matrix_3 = function ()
{
	var self = this;

	var xn = self.matrix_in_reg("x");
	if (! xn) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}
	var x = H.matrix_from_mem(self.matrix_mem(xn), self.matrix_size(xn));

	var res = x.ztilde_zp();

	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(xn, res[0], res[1]);

	self.display_result();
};

Hp12c_machine.prototype.matrix_4 = function ()
{
	var self = this;

	var tgt = self.matrix_in_reg("x");
	if (! tgt) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = H.matrix_from_mem(self.matrix_mem(tgt), self.matrix_size(tgt));
	var mt = m.transpose(); // cannot fail
	var mtl = H.matrix_to_mem(mt);
	self.matrix_mem_Set(tgt, mtl[0], mtl[1]);

	self.display_result();
};

Hp12c_machine.prototype.matrix_5 = function ()
{
	var self = this;

	var x = self.matrix_in_reg("x");
	if (! x) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var y = self.matrix_in_reg("y");
	if (! y) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	if (x === self.mR || y === self.mR) {
		// result matrix must be different
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var mx = H.matrix_from_mem(self.matrix_mem(x), self.matrix_size(x));
	var my = H.matrix_from_mem(self.matrix_mem(y), self.matrix_size(y));

	var product = my.multiplytransposed(mx);
	if (product === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var rproduct = H.matrix_to_mem(product);
	self.matrix_mem_Set(self.mR, rproduct[0], rproduct[1]);
	self.save_lastx();
	self.pop();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_6 = function ()
{
	var self = this;

	var x = self.matrix_in_reg("x");
	if (! x) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var y = self.matrix_in_reg("y");
	if (! y) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	if (x === self.mR || y === self.mR) {
		// result matrix must be different
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var mx = H.matrix_from_mem(self.matrix_mem(x), self.matrix_size(x));
	var my = H.matrix_from_mem(self.matrix_mem(y), self.matrix_size(y));
	var mr = H.matrix_from_mem(self.matrix_mem(self.mR), self.matrix_size(self.mR));

	var res = H.matrix_residual(mr, my, mx);
	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(self.mR, res[0], res[1]);
	self.save_lastx();
	self.pop();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_7 = function ()
{
	var self = this;

	var m;

	var tgt = self.matrix_in_reg("x");
	if (tgt) {
		m = H.matrix_from_mem(self.matrix_mem(tgt), self.matrix_size(tgt));
	} else {
		m = H.matrix([[self.reg_real("x")]]);
		self.incr_ip(1);
	}

	var res = m.rownorm(); // cannot fail
	self.save_lastx();
	self.reg_Set_real("x", res);

	self.display_result();
};

Hp12c_machine.prototype.matrix_8 = function ()
{
	var self = this;

	var m;

	var tgt = self.matrix_in_reg("x");
	if (tgt) {
		m = H.matrix_from_mem(self.matrix_mem(tgt), self.matrix_size(tgt));
	} else {
		m = H.matrix([[self.reg_real("x")]]);
		self.incr_ip(1);
	}

	var res = m.euclideannorm(); // cannot fail
	self.save_lastx();
	self.reg_Set_real("x", res);

	self.display_result();
};

Hp12c_machine.prototype.matrix_9 = function ()
{
	var self = this;

	var tgt = self.matrix_in_reg("x");
	if (! tgt) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = H.matrix_from_mem(self.matrix_mem(tgt), self.matrix_size(tgt));
	var res = m.determinant();

	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.save_lastx();
	self.reg_Set_real("x", res);
	self.matrix_mem_Set(self.mR, self.matrix_mem(tgt), self.matrix_size(tgt));

	self.display_result();
};

Hp12c_machine.prototype.matrix_dim = function (n)
{
	var self = this;

	var rows = self.reg_real("y");
	var cols = self.reg_real("x");

	if (! self.chk_matrix_rows(rows) || ! self.chk_matrix_cols(cols)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.matrix_size(n)[0] = rows;
	self.matrix_size(n)[1] = cols;

	var linear_size = rows * cols;
	var m = self.matrix_mem(n);

	while (m.length < linear_size) {
		m.push(0);
	}

	if (m.length > linear_size) {
		m.splice(m.length, m.length - linear_size);
	}

	self.display_result();
};

Hp12c_machine.prototype.rcl_matrix_dim = function (n)
{
	var self = this;

	self.push();
	self.push();
	self.reg_Set_real("y", self.matrix_size(n)[0]);
	self.reg_Set_real("x", self.matrix_size(n)[1]);
	self.display_result();
};

Hp12c_machine.prototype.rcl_matrix_dim_I = function ()
{
	var self = this;

	if (! self.matrix_in_index()) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.rcl_matrix_dim(self.index);
};

Hp12c_machine.prototype.matrix_dim_I = function ()
{
	var self = this;

	if (! self.matrix_in_index()) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	self.matrix_dim(self.index);
};

Hp12c_machine.prototype.matrix_plus = function ()
{
	var self = this;

	var x = self.matrix_in_reg("x");
	if (x) {
		x = H.matrix_from_mem(self.matrix_mem(x), self.matrix_size(x));
	} else {
		x = self.reg_real("x");
	}

	var y = self.matrix_in_reg("y");
	if (y) {
		y = H.matrix_from_mem(self.matrix_mem(y), self.matrix_size(y));
	} else {
		y = self.reg_real("y");
	}

	var res = H.matrix_sum(y, x);
	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(self.mR, res[0], res[1]);
	self.save_lastx();
	self.pop();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_minus = function ()
{
	var self = this;

	var x = self.matrix_in_reg("x");
	if (x) {
		x = H.matrix_from_mem(self.matrix_mem(x), self.matrix_size(x));
	} else {
		x = self.reg_real("x");
	}

	var y = self.matrix_in_reg("y");
	if (y) {
		y = H.matrix_from_mem(self.matrix_mem(y), self.matrix_size(y));
	} else {
		y = self.reg_real("y");
	}

	var res = H.matrix_subtract(y, x);
	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(self.mR, res[0], res[1]);
	self.save_lastx();
	self.pop();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_multiply = function ()
{
	var self = this;

	var x = self.matrix_in_reg("x");
	if (x) {
		if (self.mR === x) {
			self.display_error(H.ERROR_MATRIX_ARG);
			return;
		}
		x = H.matrix_from_mem(self.matrix_mem(x), self.matrix_size(x));
	} else {
		x = self.reg_real("x");
	}

	var y = self.matrix_in_reg("y");
	if (y) {
		if (self.mR === y) {
			self.display_error(H.ERROR_MATRIX_ARG);
			return;
		}
		y = H.matrix_from_mem(self.matrix_mem(y), self.matrix_size(y));
	} else {
		y = self.reg_real("y");
	}

	var res = H.matrix_multiply(y, x);
	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(self.mR, res[0], res[1]);
	self.save_lastx();
	self.pop();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_divide = function ()
{
	var self = this;

	var x = self.matrix_in_reg("x");
	if (x) {
		if (self.mR === x) {
			self.display_error(H.ERROR_MATRIX_ARG);
			return;
		}
		x = H.matrix_from_mem(self.matrix_mem(x), self.matrix_size(x));
	} else {
		x = self.reg_real("x");
	}

	var y = self.matrix_in_reg("y");
	if (y) {
		y = H.matrix_from_mem(self.matrix_mem(y), self.matrix_size(y));
	} else {
		y = self.reg_real("y");
	}

	var res = H.matrix_divide(y, x);
	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(self.mR, res[0], res[1]);
	self.save_lastx();
	self.pop();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_chs = function ()
{
	var self = this;

	var xn = self.matrix_in_reg("x");
	var x = H.matrix_from_mem(self.matrix_mem(xn), self.matrix_size(xn));

	var res = x.chs();

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(xn, res[0], res[1]);

	self.display_result();
};

Hp12c_machine.prototype.matrix_reciprocal = function ()
{
	var self = this;

	var x = self.matrix_in_reg("x");
	x = H.matrix_from_mem(self.matrix_mem(x), self.matrix_size(x));

	var res = x.inverse();

	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res[0]);
	self.matrix_mem_Set(self.mR, res[0], res[1]);
	self.save_lastx();
	self.reg_Set_tuple("x", {r: self.mR, h: 1, i: 0});

	self.display_result();
};

Hp12c_machine.prototype.matrix_zc_zp = function ()
{
	var self = this;

	var xn = self.matrix_in_reg("x");
	var x = H.matrix_from_mem(self.matrix_mem(xn), self.matrix_size(xn));

	var res = x.zc_zp();

	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(xn, res[0], res[1]);

	self.display_result();
};

Hp12c_machine.prototype.matrix_zp_zc = function ()
{
	var self = this;

	var xn = self.matrix_in_reg("x");
	var x = H.matrix_from_mem(self.matrix_mem(xn), self.matrix_size(xn));

	var res = x.zp_zc();

	if (res === null) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	res = H.matrix_to_mem(res);
	self.matrix_mem_Set(xn, res[0], res[1]);

	self.display_result();
};

Hp12c_machine.prototype.isg = function (sto)
{	
	var self = this;

	var word = self.isg_core(self.sto_tuple(sto).r);
	self.sto_Set_tuple(sto, {r: word, h: 0, i: 0});
};

Hp12c_machine.prototype.isg_indirect_matrix = function ()
{	
	var self = this;

	// guaranteed to be good since this method is
	// aways called by isg_indirect()
	var n = self.index;

	var row = Math.floor(self.sto_tuple(0).r);
	var col = Math.floor(self.sto_tuple(1).r);

	if (! self.chk_matrix_rows(row, n) || ! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = self.matrix_mem(n);
	var i = self.linear_element(row, col, n);

	var word = self.isg_core(m[i]);
	m[i] = word;

};

Hp12c_machine.prototype.isg_indirect = function ()
{
	var self = this;
	if (self.matrix_in_index()) {
		self.isg_indirect_matrix();
		return;
	}

	var index = self.fix_index();
	if (index === null) {
		return;
	}

	self.isg(index);
	return;
};

Hp12c_machine.prototype.dse_indirect_matrix = function ()
{	
	var self = this;

	// guaranteed to be good since this method is
	// aways called by dse_indirect()
	var n = self.index;

	var row = Math.floor(self.sto_tuple(0).r);
	var col = Math.floor(self.sto_tuple(1).r);

	if (! self.chk_matrix_rows(row, n) || ! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = self.matrix_mem(n);
	var i = self.linear_element(row, col, n);

	var word = self.dse_core(m[i]);
	m[i] = word;
};

Hp12c_machine.prototype.dse_indirect = function ()
{
	var self = this;
	if (self.matrix_in_index()) {
		self.dse_indirect_matrix();
		return;
	}

	var index = self.fix_index();
	if (index === null) {
		return;
	}

	self.dse(index);
	return;
};

Hp12c_machine.prototype.dse = function (sto)
{	
	var self = this;

	var word = self.dse_core(self.sto_tuple(sto).r);
	self.sto_Set_tuple(sto, {r: word, h: 0, i: 0});
};

Hp12c_machine.prototype.isg_matrix = function (n)
{
	var self = this;

	var row = Math.floor(self.sto_tuple(0).r);
	var col = Math.floor(self.sto_tuple(1).r);

	if (! self.chk_matrix_rows(row, n) || ! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = self.matrix_mem(n);
	var i = self.linear_element(row, col, n);

	var word = m[i];
	word = self.isg_core(word);
	m[i] = word;
};

Hp12c_machine.prototype.dse_matrix = function (n)
{
	var self = this;

	var row = Math.floor(self.sto_tuple(0).r);
	var col = Math.floor(self.sto_tuple(1).r);

	if (! self.chk_matrix_rows(row, n) || ! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = self.matrix_mem(n);
	var i = self.linear_element(row, col, n);

	var word = m[i];
	word = self.dse_core(word);
	m[i] = word;
};

Hp12c_machine.prototype.sto_infix_matrix_el_i = function (op)
{
	var self = this;
	// index already checked at this point
	self.sto_infix_matrix_el(op, self.index);
	return;
};

Hp12c_machine.prototype.sto_infix_matrix_el = function (op, n)
{
	var self = this;

	var row = Math.floor(self.sto_tuple(0).r);
	var col = Math.floor(self.sto_tuple(1).r);

	if (! self.chk_matrix_rows(row, n) || ! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = self.matrix_mem(n);
	var i = self.linear_element(row, col, n);

	var a = {r: m[i], h: 0, i: 0};
	a = self.stoinfix_core(a, op);
	if (a === null) {
		return;
	}
	m[i] = a.r;
	
	self.display_matrix(n, row, col);
};

Hp12c_machine.prototype.rcl_infix_matrix_el_i = function (op)
{
	var self = this;
	// index already checked at this point
	self.rcl_infix_matrix_el(op, self.index);
	return;
};

Hp12c_machine.prototype.rcl_infix_matrix_el = function (op, n)
{
	var self = this;

	var row = Math.floor(self.sto_tuple(0).r);
	var col = Math.floor(self.sto_tuple(1).r);

	if (! self.chk_matrix_rows(row, n) || ! self.chk_matrix_cols(col, n)) {
		self.display_error(H.ERROR_MATRIX_ARG);
		return;
	}

	var m = self.matrix_mem(n);
	var i = self.linear_element(row, col, n);

	var b = {r: m[i], h: 0, i: 0};
	self.rclinfix_core(b, op);
};

Hp12c_machine.prototype.rclinfix_index = function (operation)
{
	var self = this;

	if (self.matrix_in_index()) {
		self.rcl_infix_matrix_el_i(operation);
		return;
	}

	var index = self.fix_index();
 
	if (index === null) {
		return;
	}

	self.rclinfix(index, operation);
};

Hp12c_machine.prototype.rclinfix_index_itself = function (operation)
{
	var self = this;

	if (self.matrix_in_index()) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	self.rclinfix(99999, operation);
};

Hp12c_machine.prototype.stoinfix_index_itself = function (operation)
{
	var self = this;

	if (self.matrix_in_index()) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	self.stoinfix(99999, operation);
};

Hp12c_machine.prototype.rclinfix = function (pos, operation)
{
	var self = this;

	var b;
	if (pos === 99999) {
		b = {r: self.index, i: 0, h: 0};
	} else {
		b = self.sto_tuple(pos);
	}
	self.rclinfix_core(b, operation);
};

Hp12c_machine.prototype.rclinfix_core = function (b, operation)
{
	var self = this;

	if (self.matrix_in_reg("x")) {
		self.display_error(H.ERROR_MATRIX_OP);
		return;
	}

	var a = self.reg_tuple("x");
	// result = a - b (register minus memory)
	// (the inverse of stoinfix)

	if (operation ==  H.RCL_PLUS) {
		a = self.tarithmetic(a, b, "+");
	} else if (operation == H.RCL_MINUS) {
		a = self.tarithmetic(a, b, "-");
	} else if (operation == H.RCL_TIMES) {
		a = self.tarithmetic(a, b, "x");
	} else if (operation == H.RCL_DIVIDE) {
		a = self.tarithmetic(a, b, "/");
		if (H.badnumber(a.r)) {
			self.display_error(H.ERROR_DIVZERO);
			return;
		}
	}

	a.r = H.clamp(a.r);

	self.reg_Set_tuple("x", a);
	self.display_result();
};

Hp12c_machine.prototype.cf_index = function ()
{
	var d = Math.floor(Math.abs(this.index));
	this.cf(d);
};

Hp12c_machine.prototype.sf_index = function ()
{
	var d = Math.floor(Math.abs(this.index));
	this.sf(d);
};

Hp12c_machine.prototype.f_question_index = function ()
{
	var d = Math.floor(Math.abs(this.index));
	this.f_question(d);
};

Hp12c_machine.prototype.set_decimals_index = function (notation)
{
	var d = Math.min(Math.floor(Math.abs(this.index)), 9);
	this.set_decimals(d, notation);
};

/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_dispatcher()
{
}

// aliases to function and modifier arrays;
var K = [];
var M = [];
var I;

Hp12c_dispatcher.prototype.functions = K;
Hp12c_dispatcher.prototype.modifier_sm = M;

Hp12c_dispatcher.prototype.KEY_RS = 31;
Hp12c_dispatcher.prototype.KEY_SST = 21;
H.KEY_INDEX = Hp12c_dispatcher.prototype.KEY_INDEX = 25;
H.FF = Hp12c_dispatcher.prototype.KEY_FF = 42;
H.GG = Hp12c_dispatcher.prototype.KEY_GG  = 43;
H.STO = Hp12c_dispatcher.prototype.KEY_STO = 44;
H.RCL = Hp12c_dispatcher.prototype.KEY_RCL = 45;
H.GTO = Hp12c_dispatcher.prototype.KEY_GTO = 22;
H.GTO_DOT = H.GTO * 100 + 48;
H.GSB = Hp12c_dispatcher.prototype.KEY_GSB = 32;
H.GSB_DOT = H.GSB * 100 + 48;
H.SOLVE = H.FF * 100 + 10;
H.SOLVE_DOT = H.SOLVE * 100 + 48;
H.INTEG = H.FF * 100 + 20;
H.INTEG_DOT = H.INTEG * 100 + 48;
Hp12c_dispatcher.prototype.KEY_DECIMAL = 48;
Hp12c_dispatcher.prototype.KEY_PLUS = 40;
Hp12c_dispatcher.prototype.KEY_MINUS = 30;
Hp12c_dispatcher.prototype.KEY_MULTIPLY = 20;
Hp12c_dispatcher.prototype.KEY_DIVIDE = 10;
Hp12c_dispatcher.prototype.KEY_BACKSPACE = 35;
Hp12c_dispatcher.prototype.KEY_RDOWN = 33;
H.KEY_CHS = Hp12c_dispatcher.prototype.KEY_CHS = 16;
H.STO2 = H.STO * 100 + 48;
H.STO_FF = H.STO * 100 + H.FF;
H.RCL_FF = H.RCL * 100 + H.FF;
H.STO_GG = H.STO * 100 + H.GG;
H.RCL_GG = H.RCL * 100 + H.GG;
H.RCL2 = H.RCL * 100 + 48;
H.RCL_FF = H.RCL * 100 + H.FF;
H.STO_PLUS = H.STO * 100 + 40;
H.STO_MINUS = H.STO * 100 + 30;
H.STO_TIMES = H.STO * 100 + 20;
H.STO_DIVIDE = H.STO * 100 + 10;
H.STO_PLUS_DOT = H.STO_PLUS * 100 + 48;
H.STO_MINUS_DOT = H.STO_MINUS * 100 + 48;
H.STO_TIMES_DOT = H.STO_TIMES * 100 + 48;
H.STO_DIVIDE_DOT = H.STO_DIVIDE * 100 + 48;
H.RCL_PLUS = H.RCL * 100 + 40;
H.RCL_MINUS = H.RCL * 100 + 30;
H.RCL_TIMES = H.RCL * 100 + 20;
H.RCL_DIVIDE = H.RCL * 100 + 10;
H.RCL_PLUS_DOT = H.RCL_PLUS * 100 + 48;
H.RCL_MINUS_DOT = H.RCL_MINUS * 100 + 48;
H.RCL_TIMES_DOT = H.RCL_TIMES * 100 + 48;
H.RCL_DIVIDE_DOT = H.RCL_DIVIDE * 100 + 48;
H.STO_PLUS_FF = H.STO_PLUS * 100 + H.FF;
H.STO_MINUS_FF = H.STO_MINUS * 100 + H.FF;
H.STO_TIMES_FF = H.STO_TIMES * 100 + H.FF;
H.STO_DIVIDE_FF = H.STO_DIVIDE * 100 + H.FF;
H.RCL_PLUS_FF = H.RCL_PLUS * 100 + H.FF;
H.RCL_MINUS_FF = H.RCL_MINUS * 100 + H.FF;
H.RCL_TIMES_FF = H.RCL_TIMES * 100 + H.FF;
H.RCL_DIVIDE_FF = H.RCL_DIVIDE * 100 + H.FF;
H.GTO_MOVE = H.GTO * 100 + H.KEY_CHS; // CHS
H.HYP = H.FF * 100 + H.GTO;
H.HYPINV = H.GG * 100 + H.GTO;
H.LBL = H.FF * 100 + 21; // f-SST
H.LBL_DOT = H.LBL * 100 + 48;
H.FIX = H.FF * 100 + 7;
H.SCI = H.FF * 100 + 8;
H.ENG = H.FF * 100 + 9;
H.STO_F = H.STO * 100 + H.FF;
H.GG_CF = H.GG * 100 + 5; // is NOT equivalent to GG for other keys
H.GG_SF = H.GG * 100 + 4;
H.GG_FQUESTION = H.GG * 100 + 6;
H.FF_EXCHANGE = H.FF * 100 + 4;
H.FF_EXCHANGE_DOT = H.FF_EXCHANGE * 100 + 48;
H.GG_TEST = H.GG * 100 + 30;
H.DIM = H.FF * 100 + 23;
H.RCL_DIM = H.RCL * 10000 + H.DIM;
H.MATRIX = H.FF * 100 + 16;
H.STO_MATRIX = H.STO * 100 + 16;
H.RCL_MATRIX = H.RCL * 100 + 16;
H.STO_FF_MATRIX = H.STO * 10000 + H.FF * 100 + 16;
H.RCL_FF_MATRIX = H.RCL * 10000 + H.FF * 100 + 16;
H.RESULT = H.FF * 100 + 26;
H.DSE = H.FF * 100 + 5;
H.DSE_DOT = H.DSE * 100 + 48;
H.ISG = H.FF * 100 + 6;
H.ISG_DOT = H.ISG * 100 + 48;

Hp12c_dispatcher.init_vars = function () {
	var Keys = [11, 12, 13, 14, 15, 16, 7, 8, 9, 10,
	    21, 22, 23, 24, 25, 26, 4, 5, 6, 20,
	    31, 32, 33, 34, 35, 36, 1, 2,  3, 30,
	    41, 42, 43, 44, 45, 0, 48, 49, 40,
	    50];

	var Modifiers = [H.FF, H.GG, H.STO, H.RCL, 48, 10, 20, 30, 40,
			 4, 5, 6, 7, 8, 9, H.GTO, 21, H.GSB, 16, 23, 26]; 

	var i;

	for (i = 0; i < Keys.length; i++) {
		K[Keys[i]] = [];
	}

	for (i = 0; i < Modifiers.length; i++) {
		M[Modifiers[i]] = [];
	}
};

Hp12c_dispatcher.init_vars();

var add_sgroup = function (si, ni)
{
	var name = ["plus", "minus", "times", "divide"];
	var oper = ["+", "-", "x", "/"];

	var add_group = function (xx) {
		var sto_mod = "STO_" + name[xx].toUpperCase();
		var sto_modf = "STO_" + name[xx].toUpperCase() + "_FF";
		var sto_xmod = H[sto_mod];
		var sto_xmodf = H[sto_modf];
		var sto_mnemonic = "STO " + oper[xx] + " " + si;
		var sto_mnemonicf = "STO " + oper[xx] + " f " + si;
		var sto_clos = "sto_infix_matrix_el";

		var rcl_mod = "RCL_" + name[xx].toUpperCase();
		var rcl_modf = "RCL_" + name[xx].toUpperCase() + "_FF";
		var rcl_xmod = H[rcl_mod];
		var rcl_xmodf = H[rcl_modf];
		var rcl_mnemonic = "RCL " + oper[xx] + " " + si;
		var rcl_mnemonicf = "RCL " + oper[xx] + " f " + si;
		var rcl_clos = "rcl_infix_matrix_el";

		K[I][sto_xmod] = H.make_closure(sto_clos, [sto_xmod, ni], sto_mnemonic);
		K[I][sto_xmod].shrink = 2;
		K[I][sto_xmodf] = H.make_closure(sto_clos, [sto_xmod, ni], sto_mnemonicf);
		K[I][sto_xmodf].shrink = 2;
		K[I][sto_xmodf].reducible = true;
		K[I][sto_xmodf].reduced_modifier = sto_xmod;
	
		K[I][rcl_xmod] = H.make_closure(rcl_clos, [rcl_xmod, ni], rcl_mnemonic);
		K[I][rcl_xmod].shrink = 2;
		K[I][rcl_xmodf] = H.make_closure(rcl_clos, [rcl_xmod, ni], rcl_mnemonicf);
		K[I][rcl_xmodf].shrink = 2;
		K[I][rcl_xmodf].reducible = true;
		K[I][rcl_xmodf].reduced_modifier = rcl_xmod;
	};

	for (var xx = 0; xx < name.length; ++xx) {
		add_group(xx);
	}
};

for (I = 11; I <= 15; ++I) {
	var SI = (I - 1).toString(16);
	var k = 20 - 11; // in 15c, LBL A ~= LBL 20

	K[I][H.FF] = H.make_pgrm_closure("user", I + k, "USER " + SI);
	K[I][H.FF].shrink = 2;

	K[I][H.GSB] = H.make_pgrm_closure("gosub", I + k, "GSB " + SI);
	K[I][H.GSB].shrink = 2;
	K[I][H.LBL] = H.make_pgrm_closure("label", I + k, "LBL " + SI);
	K[I][H.LBL].shrink = 2;
	K[I][H.GTO] = H.make_pgrm_closure("gto", I + k, "GTO " + SI);
	K[I][H.GTO].shrink = 2;

	K[I][H.SOLVE] = H.make_closure("solve", [I + k], "SOLVE " + SI);
	K[I][H.SOLVE].shrink = 2;
	K[I][H.INTEG] = H.make_closure("integrate", [I + k], "INTEG " + SI);
	K[I][H.INTEG].shrink = 2;

	K[I][H.STO] = H.make_closure("sto_matrix_el", [I + k], "STO " + SI);
	K[I][H.STO].shrink = 2;
	K[I][H.STO_GG] = H.make_closure("sto_g_matrix_el", [I + k], "STO g " + SI);
	K[I][H.STO_GG].shrink = 2;
	K[I][H.RCL] = H.make_closure("rcl_matrix_el", [I + k], "RCL " + SI);
	K[I][H.RCL].shrink = 2;
	K[I][H.RCL_GG] = H.make_closure("rcl_g_matrix_el", [I + k], "RCL g " + SI);
	K[I][H.RCL_GG].shrink = 2;
	K[I][H.DIM] = H.make_closure("matrix_dim", [I + k], "DIM " + SI);
	K[I][H.DIM].shrink = 2;
	K[I][H.RCL_DIM] = H.make_closure("rcl_matrix_dim", [I + k], "RCL DIM " + SI);
	K[I][H.RCL_DIM].shrink = 2;

	K[I][H.STO_MATRIX] = H.make_closure("sto_matrix", [I + k], "STO MATRIX " + SI);
	K[I][H.STO_MATRIX].shrink = 2;
	K[I][H.STO_FF_MATRIX] = H.make_closure("sto_matrix", [I + k], "STO f MATRIX " + SI);
	K[I][H.STO_FF_MATRIX].shrink = 2;
	K[I][H.STO_FF_MATRIX].reducible = true;
	K[I][H.STO_FF_MATRIX].reduced_modifier = H.STO_MATRIX;

	K[I][H.RCL_MATRIX] = H.make_closure("rcl_matrix", [I + k], "RCL MATRIX " + SI);
	K[I][H.RCL_MATRIX].shrink = 2;
	K[I][H.RCL_FF_MATRIX] = H.make_closure("rcl_matrix", [I + k], "RCL f MATRIX " + SI);
	K[I][H.RCL_FF_MATRIX].shrink = 2;
	K[I][H.RCL_FF_MATRIX].reducible = true;
	K[I][H.RCL_FF_MATRIX].reduced_modifier = H.RCL_MATRIX;

	K[I][H.RESULT] = H.make_closure("result_matrix", [I + k], "RESULT " + SI);

	K[I][H.FF_EXCHANGE] = H.make_closure("x_exchange_matrix", [I + k], "X<->" + SI);

	K[I][H.ISG] = H.make_closure("isg_matrix", [I + k], "ISG " + SI);
	K[I][H.ISG].shrink = 2;
	K[I][H.DSE] = H.make_closure("dse_matrix", [I + k], "DSE " + SI);
	K[I][H.DSE].shrink = 2;

	add_sgroup(SI, I + k);
}

I = 11;

K[I][H.GG] = H.make_closure("square", [], "SQUARE");
K[I][0] = H.make_closure("sqroot", [], "SQRT");

I = 12;

K[I][H.GG] = H.make_closure("ln", [], "LN");
K[I][0] = H.make_closure("exp", [], "EXP");

I = 13;

K[I][H.GG] = H.make_closure("log10", [], "LOG10");
K[I][0] = H.make_closure("power10", [], "POWER10");

I = 14;

K[I][H.GG] = H.make_closure("percent", [], "%");
K[I][0] = H.make_closure("poweryx", [], "POWER");

I = 15;

K[I][H.GG] = H.make_closure("deltapercent", [], "D%");
K[I][0] = H.make_closure("reciprocal", [], "1/X");

I = 16;

K[I][H.GG] = H.make_closure("abs", [], "ABS");
K[I][0] = H.make_closure("chs", [], "CHS");
M[I][H.GTO] = H.GTO_MOVE;
M[I][H.FF] = H.MATRIX;
M[I][H.STO_FF] = H.STO_FF_MATRIX;
M[I][H.RCL_FF] = H.RCL_FF_MATRIX;
M[I][H.STO] = H.STO_MATRIX;
M[I][H.RCL] = H.RCL_MATRIX;

for (I = 0; I <= 9; ++I) {
	SI = I.toString(16);

	// adds all functions that are commond to all digits
	K[I][H.FIX] = H.make_closure("set_decimals", [I, H.NOTATION_FIX], "FIX " + SI);
	K[I][H.SCI] = H.make_closure("set_decimals", [I, H.NOTATION_SCI], "SCI " + SI);
	K[I][H.ENG] = H.make_closure("set_decimals", [I, H.NOTATION_ENG], "ENG " + SI);
	K[I][H.RCL] = H.make_closure("rcl", [I], "RCL " + SI);
	K[I][H.RCL2] = H.make_closure("rcl", [I + 10], "RCL . " + SI);
	K[I][H.STO] = H.make_closure("sto", [I], "STO " + SI);
	K[I][H.STO2] = H.make_closure("sto", [I + 10], "STO . " + SI);
	K[I][H.STO_PLUS] = H.make_closure("stoinfix", [I, H.STO_PLUS], "STO + " + SI);
	K[I][H.STO_MINUS] = H.make_closure("stoinfix", [I, H.STO_MINUS], "STO - " + SI);
	K[I][H.STO_TIMES] = H.make_closure("stoinfix", [I, H.STO_TIMES], "STO x " + SI);
	K[I][H.STO_DIVIDE] = H.make_closure("stoinfix", [I, H.STO_DIVIDE], "STO / " + SI);

	K[I][H.STO_PLUS_DOT] = H.make_closure("stoinfix", [I + 10, H.STO_PLUS], "STO + . " + SI);
	K[I][H.STO_PLUS_DOT].shrink = 1;
	K[I][H.STO_MINUS_DOT] = H.make_closure("stoinfix", [I + 10, H.STO_MINUS], "STO - . " + SI);
	K[I][H.STO_MINUS_DOT].shrink = 1;
	K[I][H.STO_TIMES_DOT] = H.make_closure("stoinfix", [I + 10, H.STO_TIMES], "STO x . " + SI);
	K[I][H.STO_TIMES_DOT].shrink = 1;
	K[I][H.STO_DIVIDE_DOT] = H.make_closure("stoinfix", [I + 10, H.STO_DIVIDE], "STO / . " + SI);
	K[I][H.STO_DIVIDE_DOT].shrink = 1;
	K[I][H.RCL_PLUS] = H.make_closure("rclinfix", [I, H.RCL_PLUS], "RCL + " + SI);
	K[I][H.RCL_MINUS] = H.make_closure("rclinfix", [I, H.RCL_MINUS], "RCL - " + SI);
	K[I][H.RCL_TIMES] = H.make_closure("rclinfix", [I, H.RCL_TIMES], "RCL x " + SI);
	K[I][H.RCL_DIVIDE] = H.make_closure("rclinfix", [I, H.RCL_DIVIDE], "RCL / " + SI);

	K[I][H.RCL_PLUS_DOT] = H.make_closure("rclinfix", [I + 10, H.RCL_PLUS], "RCL + . " + SI);
	K[I][H.RCL_PLUS_DOT].shrink = 1;
	K[I][H.RCL_MINUS_DOT] = H.make_closure("rclinfix", [I + 10, H.RCL_MINUS], "RCL - . " + SI);
	K[I][H.RCL_MINUS_DOT].shrink = 1;
	K[I][H.RCL_TIMES_DOT] = H.make_closure("rclinfix", [I + 10, H.RCL_TIMES], "RCL x . " + SI);
	K[I][H.RCL_TIMES_DOT].shrink = 1;
	K[I][H.RCL_DIVIDE_DOT] = H.make_closure("rclinfix", [I + 10, H.RCL_DIVIDE], "RCL / . " + SI);
	K[I][H.RCL_DIVIDE_DOT].shrink = 1;

	K[I][H.GTO] = H.make_pgrm_closure("gto", I, "GTO " + SI);
	K[I][H.GTO_MOVE] = H.make_closure("gto_digit_add", [I], "GTO DIGIT ADD " + SI);
	K[I][H.GTO_MOVE].dont_rst_modifier = 1;
	K[I][H.GSB] = H.make_pgrm_closure("gosub", I, "GSB " + SI);
	K[I][H.SOLVE] = H.make_closure("solve", [I], "SOLVE " + SI);
	K[I][H.INTEG] = H.make_closure("integrate", [I], "INTEG " + SI);
	K[I][H.LBL] = H.make_pgrm_closure("label", I, "LBL " + SI);
	K[I][H.GTO] = H.make_pgrm_closure("gto",   I, "GTO " + SI);

	K[I][H.GSB_DOT] = H.make_pgrm_closure("gosub", I + 10, "GSB . " + SI);
	K[I][H.GSB_DOT].shrink = 1;
	K[I][H.LBL_DOT] = H.make_pgrm_closure("label", I + 10, "LBL . " + SI);
	K[I][H.LBL_DOT].shrink = 1;
	K[I][H.GTO_DOT] = H.make_pgrm_closure("gto",   I + 10, "GTO . " + SI);
	K[I][H.GTO_DOT].shrink = 1;

	K[I][H.SOLVE_DOT] = H.make_closure("solve", [I + 10], "SOLVE . " + SI);
	K[I][H.SOLVE_DOT].shrink = 1;

	K[I][H.INTEG_DOT] = H.make_closure("integrate", [I + 10], "INTEG . " + SI);
	K[I][H.INTEG_DOT].shrink = 1;

	K[I][H.GG_SF] = H.make_closure("sf", [I], "SF " + SI);
	K[I][H.GG_CF] = H.make_closure("cf", [I], "CF " + SI);
	K[I][H.GG_FQUESTION] = H.make_closure("f_question", [I], "F? " + SI);
	K[I][H.GG_TEST] = H.make_closure("test_15c", [I], "TEST " + SI);
	K[I][H.FF_EXCHANGE] = H.make_closure("x_exchange_for", [I], "X<->" + SI);

	K[I][H.FF_EXCHANGE_DOT] = H.make_closure("x_exchange_for", [I + 10], "X<->." + SI);
	K[I][H.FF_EXCHANGE_DOT].shrink = 1;

	K[I][H.MATRIX] = H.make_closure("matrix_" + SI, [], "MATRIX " + SI);

	K[I][H.ISG] = H.make_closure("isg", [I], "ISG " + SI);
	K[I][H.DSE] = H.make_closure("dse", [I], "DSE " + SI);
	K[I][H.ISG_DOT] = H.make_closure("isg", [I + 10], "ISG . " + SI);
	K[I][H.ISG_DOT].shrink = 1;
	K[I][H.DSE_DOT] = H.make_closure("dse", [I + 10], "DSE . " + SI);
	K[I][H.DSE_DOT].shrink = 1;

	K[I][0] = H.make_closure("digit_add", [I], "" + SI);
}

I = 7;

K[I][H.GG] = H.make_closure("set_trigo", [H.TRIGO_DEG], "DEG");
M[I][H.FF] = H.FIX;

I = 8;

K[I][H.GG] = H.make_closure("set_trigo", [H.TRIGO_RAD], "RAD");
M[I][H.FF] = H.SCI;

I = 9;

K[I][H.GG] = H.make_closure("set_trigo", [H.TRIGO_GRAD], "GRAD");
M[I][H.FF] = H.ENG;

I = 10;

K[I][0] = H.make_closure("divide", [], "/");
K[I][H.GG] = H.make_closure("test_x_le_y", [], "X<=Y");
M[I][H.STO] = H.STO_DIVIDE;
M[I][H.RCL] = H.RCL_DIVIDE;
M[I][H.FF] = H.SOLVE;

I = 21;

K[I][0] = H.make_pgrm_closure("sst", -1, "SST");
K[I][H.GG] = H.make_pgrm_closure("bst", -1, "BST");
M[I][H.FF] = H.LBL;

I = 22;

M[I][0] = H.GTO;
M[I][H.FF] = H.HYP;
M[I][H.GG] = H.HYPINV;

I = 23;

K[I][H.GG] = H.make_closure("triginv", ["asin"], "ASIN");
K[I][0] = H.make_closure("trig", ["sin"], "SIN");
K[I][H.HYP] = H.make_closure("htrig", ["sinh"], "SINH");
K[I][H.HYPINV] = H.make_closure("htriginv", ["asinh"], "ASINH");
M[I][H.FF] = H.DIM;
M[I][H.RCL_FF] = H.RCL_DIM;

I = 24; // (i) / COS / COS-1

K[I][H.FF] = H.make_closure("show_imaginary", [], "SHOW IMAG");
K[I][H.RCL] = H.make_closure("rcl_index", [], "RCL (I)");
K[I][H.RCL_FF] = H.make_closure("rcl_index", [], "RCL f (I)");
K[I][H.RCL_FF].reducible = true;
K[I][H.RCL_FF].reduced_modifier = H.RCL;
K[I][H.STO] = H.make_closure("sto_index", [], "STO (I)");
K[I][H.STO_FF] = H.make_closure("sto_index", [], "STO f (I)");
K[I][H.STO_FF].reducible = true;
K[I][H.STO_FF].reduced_modifier = H.STO;
K[I][H.GG] = H.make_closure("triginv", ["acos"], "ACOS");
K[I][0] = H.make_closure("trig", ["cos"], "COS");
K[I][H.HYP] = H.make_closure("htrig", ["cosh"], "COSH");
K[I][H.HYPINV] = H.make_closure("htriginv", ["acosh"], "ACOSH");
K[I][H.FF_EXCHANGE] = H.make_closure("x_exchange_index", [], "X<->(I)");
K[I][H.STO_GG] = H.make_closure("sto_g_matrix_el_i", [], "STO g (i)");
K[I][H.RCL_GG] = H.make_closure("rcl_g_matrix_el_i", [], "RCL g (i)");

(function () {
	var name = ["plus", "minus", "times", "divide"];
	var oper = ["+", "-", "x", "/"];

	var add_group = function (xx) {
		var sto_mod = "STO_" + name[xx].toUpperCase();
		var sto_modf = "STO_" + name[xx].toUpperCase() + "_FF";
		var sto_xmod = H[sto_mod];
		var sto_xmodf = H[sto_modf];
		var sto_mnemonic = "STO " + oper[xx] + " (I)";
		var sto_mnemonicf = "STO " + oper[xx] + " f (I)";
		var sto_clos = "stoinfix_index";

		var rcl_mod = "RCL_" + name[xx].toUpperCase();
		var rcl_modf = "RCL_" + name[xx].toUpperCase() + "_FF";
		var rcl_xmod = H[rcl_mod];
		var rcl_xmodf = H[rcl_modf];
		var rcl_mnemonic = "RCL " + oper[xx] + " (I)";
		var rcl_mnemonicf = "RCL " + oper[xx] + " f (I)";
		var rcl_clos = "rclinfix_index";

		K[I][sto_xmod] = H.make_closure(sto_clos, [sto_xmod], sto_mnemonic);
		K[I][sto_xmod].shrink = 2;
		K[I][sto_xmodf] = H.make_closure(sto_clos, [sto_xmod], sto_mnemonicf);
		K[I][sto_xmodf].shrink = 2;
		K[I][sto_xmodf].reducible = true;
		K[I][sto_xmodf].reduced_modifier = sto_xmod;
	
		K[I][rcl_xmod] = H.make_closure(rcl_clos, [rcl_xmod], rcl_mnemonic);
		K[I][rcl_xmod].shrink = 2;
		K[I][rcl_xmodf] = H.make_closure(rcl_clos, [rcl_xmod], rcl_mnemonicf);
		K[I][rcl_xmodf].shrink = 2;
		K[I][rcl_xmodf].reducible = true;
		K[I][rcl_xmodf].reduced_modifier = rcl_xmod;
	};

	for (var xx = 0; xx < name.length; ++xx) {
		add_group(xx);
	}
})();

K[I][H.ISG] = H.make_closure("isg_indirect", [], "ISG (I)");
K[I][H.DSE] = H.make_closure("dse_indirect", [], "DSE (I)");

I = 25; // I / TAN / TAN-1

K[I][H.FF] = H.make_closure("enter_complex", [], "CPLX");
K[I][H.RCL] = H.make_closure("get_index", [], "RCL I"); 
K[I][H.RCL_FF] = H.make_closure("get_index", [], "RCL f I"); 
K[I][H.RCL_FF].reducible = true;
K[I][H.RCL_FF].reduced_modifier = H.RCL;
K[I][H.STO] = H.make_closure("set_index", [], "STO I");
K[I][H.STO_FF] = H.make_closure("set_index", [], "STO f I");
K[I][H.STO_FF].reducible = true;
K[I][H.STO_FF].reduced_modifier = H.STO;
K[I][H.STO_PLUS] = H.make_closure("stoinfix_index_itself", [H.STO_PLUS], "STO + I");
K[I][H.STO_PLUS_FF] = H.make_closure("stoinfix_index_itself", [H.STO_PLUS], "STO + f I");
K[I][H.STO_PLUS_FF].reducible = true;
K[I][H.STO_PLUS_FF].reduced_modifier = H.STO_PLUS;
K[I][H.STO_MINUS] = H.make_closure("stoinfix_index_itself", [H.STO_MINUS], "STO - I");
K[I][H.STO_MINUS_FF] = H.make_closure("stoinfix_index_itself", [H.STO_MINUS], "STO - f I");
K[I][H.STO_MINUS_FF].reducible = true;
K[I][H.STO_MINUS_FF].reduced_modifier = H.STO_MINUS;
K[I][H.STO_TIMES] = H.make_closure("stoinfix_index_itself", [H.STO_TIMES], "STO x I");
K[I][H.STO_TIMES_FF] = H.make_closure("stoinfix_index_itself", [H.STO_TIMES], "STO x f I");
K[I][H.STO_TIMES_FF].reducible = true;
K[I][H.STO_TIMES_FF].reduced_modifier = H.STO_TIMES;
K[I][H.STO_DIVIDE] = H.make_closure("stoinfix_index_itself", [H.STO_DIVIDE], "STO / I");
K[I][H.STO_DIVIDE_FF] = H.make_closure("stoinfix_index_itself", [H.STO_DIVIDE], "STO / f I");
K[I][H.STO_DIVIDE_FF].reducible = true;
K[I][H.STO_DIVIDE_FF].reduced_modifier = H.STO_DIVIDE;
K[I][H.RCL_PLUS] = H.make_closure("rclinfix_index_itself", [H.RCL_PLUS], "RCL + I");
K[I][H.RCL_PLUS_FF] = H.make_closure("rclinfix_index_itself", [H.RCL_PLUS], "RCL + f I");
K[I][H.RCL_PLUS_FF].reducible = true;
K[I][H.RCL_PLUS_FF].reduced_modifier = H.RCL_PLUS;
K[I][H.RCL_MINUS] = H.make_closure("rclinfix_index_itself", [H.RCL_MINUS], "RCL - I");
K[I][H.RCL_MINUS_FF] = H.make_closure("rclinfix_index_itself", [H.RCL_MINUS], "RCL - f I");
K[I][H.RCL_MINUS_FF].reducible = true;
K[I][H.RCL_MINUS_FF].reduced_modifier = H.RCL_MINUS;
K[I][H.RCL_TIMES] = H.make_closure("rclinfix_index_itself", [H.RCL_TIMES], "RCL x I");
K[I][H.RCL_TIMES_FF] = H.make_closure("rclinfix_index_itself", [H.RCL_TIMES], "RCL x f I");
K[I][H.RCL_TIMES_FF].reducible = true;
K[I][H.RCL_TIMES_FF].reduced_modifier = H.RCL_TIMES;
K[I][H.RCL_DIVIDE] = H.make_closure("rclinfix_index_itself", [H.RCL_DIVIDE], "RCL / I");
K[I][H.RCL_DIVIDE_FF] = H.make_closure("rclinfix_index_itself", [H.RCL_DIVIDE], "RCL / f I");
K[I][H.RCL_DIVIDE_FF].reducible = true;
K[I][H.RCL_DIVIDE_FF].reduced_modifier = H.RCL_DIVIDE;
K[I][H.GG] = H.make_closure("triginv", ["atan"], "ATAN");
K[I][H.GG] = H.make_closure("triginv", ["atan"], "ATAN");
K[I][0] = H.make_closure("trig", ["tan"], "TAN");
K[I][H.HYP] = H.make_closure("htrig", ["tanh"], "TANH");
K[I][H.HYPINV] = H.make_closure("htriginv", ["atanh"], "ATANH");
K[I][H.GTO] = H.make_pgrm_closure("gto", I, "GTO I");
K[I][H.GSB] = H.make_pgrm_closure("gosub", I, "GSB I");
K[I][H.FF_EXCHANGE] = H.make_closure("x_exchange_index_itself", [], "X<->I");
K[I][H.FIX] = H.make_closure("set_decimals_index", [H.NOTATION_FIX], "FIX I");
K[I][H.SCI] = H.make_closure("set_decimals_index", [H.NOTATION_SCI], "SCI I");
K[I][H.ENG] = H.make_closure("set_decimals_index", [H.NOTATION_ENG], "ENG I");
K[I][H.GG_CF] = H.make_closure("cf_index", [], "CF I");
K[I][H.GG_SF] = H.make_closure("sf_index", [], "SF I");
K[I][H.GG_FQUESTION] = H.make_closure("f_question_index", [], "F? I");
K[I][H.RCL_DIM] = H.make_closure("rcl_matrix_dim_I", [], "RCL DIM I");
K[I][H.DIM] = H.make_closure("matrix_dim_I", [], "DIM I");
K[I][H.ISG] = H.make_closure("f_isg", [], "ISG I");
K[I][H.DSE] = H.make_closure("f_dse", [], "DSE I");

I = 26;

K[I][H.GG] = H.make_closure("pi", [], "PI"); // 15C
K[I][H.STO] = H.make_closure("sto_result_matrix", [], "STO RESULT");
K[I][H.STO_FF] = H.make_closure("sto_result_matrix", [], "STO f RESULT");
K[I][H.STO_FF].reducible = true;
K[I][H.STO_FF].reduced_modifier = H.STO;
K[I][H.RCL] = H.make_closure("rcl_result_matrix", [], "RCL RESULT");
K[I][H.RCL_FF] = H.make_closure("rcl_result_matrix", [], "RCL f RESULT");
K[I][H.RCL_FF].reducible = true;
K[I][H.RCL_FF].reduced_modifier = H.RCL;
K[I][0] = H.make_closure("input_exponential", [], "EEX");
M[I][H.FF] = H.RESULT;

I = 4;

M[I][H.FF] = H.FF_EXCHANGE;
M[I][H.GG] = H.GG_SF;

I = 5;

M[I][H.GG] = H.GG_CF;
M[I][H.FF] = H.DSE;

I = 6;

M[I][H.GG] = H.GG_FQUESTION;
M[I][H.FF] = H.ISG;

I = 20;

K[I][H.GG] = H.make_closure("test_x_eq0", [], "x=0");
K[I][0] = H.make_closure("multiply", [], "x");
M[I][H.STO] = H.STO_TIMES;
M[I][H.RCL] = H.RCL_TIMES;
M[I][H.FF] = H.INTEG;

I = 31;

K[I][H.FF] = H.make_closure("pse", [], "PSE");
K[I][H.GG] = H.make_closure("prog_pr", [], "P/R");
K[I][0] = H.make_pgrm_closure("rs", -1, "R/S");

I = 32;

K[I][H.FF] = H.make_closure("clear_statistics", [], "CLEAR STAT");
K[I][H.GG] = H.make_pgrm_closure("rtn", -1, "RTN");
M[I][0] = H.GSB;

I = 33;

K[I][H.FF] = H.make_closure("clear_prog", [0], "CLEAR PROG");
K[I][H.GG] = H.make_closure("r_up", [], "R^");
K[I][0] = H.make_closure("r_down", [], "Rv");

I = 34;

K[I][H.FF] = H.make_closure("clear_reg", [], "CLEAR REG");
K[I][H.GG] = H.make_closure("rnd", [], "RND");
K[I][0] = H.make_closure("x_exchange_y", [], "X<->Y");

I = 35;

K[I][H.FF] = H.make_closure("clear_prefix", [], "CLEAR PREFIX");
K[I][H.GG] = H.make_closure("clx", [], "CLx");
K[I][0] = H.make_closure("digit_delete", [], "BSP");

I = 36;

K[I][H.STO] = H.make_closure("random_sto", [], "STO RANDOM");
K[I][H.STO_FF] = H.make_closure("random_sto", [], "STO f RANDOM");
K[I][H.STO_FF].reducible = true;
K[I][H.STO_FF].reduced_modifier = H.STO;

K[I][H.RCL] = H.make_closure("random_rcl", [], "RCL RANDOM");
K[I][H.RCL_FF] = H.make_closure("random_rcl", [], "RCL f RANDOM");
K[I][H.RCL_FF].reducible = true;
K[I][H.RCL_FF].reduced_modifier = H.RCL;

K[I][H.FF] = H.make_closure("random", [], "RANDOM");
K[I][H.GG] = H.make_closure("lstx", [1], "LSTx");
K[I][0] = H.make_closure("enter", [0], "ENTER");

I = 1;

K[I][H.GG] = H.make_closure("polar", [], "->P");
K[I][H.FF] = H.make_closure("orthogonal", [], "->R");


I = 2;

K[I][H.FF] = H.make_closure("to_hms", [0], "->HMS");
K[I][H.GG] = H.make_closure("to_hour", [0], "->HOUR");

I = 3;

K[I][H.FF] = H.make_closure("to_radians", [], "->RAD");
K[I][H.GG] = H.make_closure("to_degrees", [], "->DEG");

I = 30;

K[I][0] = H.make_closure("minus", [], "-");
K[I][H.FF] = H.make_closure("complex_re_im", [], "RE-IM");
M[I][H.STO] = H.STO_MINUS;
M[I][H.RCL] = H.RCL_MINUS;
M[I][H.GG] = H.GG_TEST;

I = 41;

K[I][0] = H.make_closure("toggle_decimal_character", [], "ON");
K[I][H.RCL] = H.make_closure("shv", [], "SHV");
K[I][0].no_pgrm = 1;
K[I][H.STO] = H.make_closure("apocryphal", [1], "APOCRYPHAL 1");
K[I][H.RCL].no_pgrm = 1;
K[I][H.STO].no_pgrm = 1;

I = 42;

M[I][H.STO] = H.STO_FF;
M[I][H.RCL] = H.RCL_FF;
M[I][H.STO_PLUS] = H.STO_PLUS_FF;
M[I][H.STO_MINUS] = H.STO_MINUS_FF;
M[I][H.STO_TIMES] = H.STO_TIMES_FF;
M[I][H.STO_DIVIDE] = H.STO_DIVIDE_FF;
M[I][H.RCL_PLUS] = H.RCL_PLUS_FF;
M[I][H.RCL_MINUS] = H.RCL_MINUS_FF;
M[I][H.RCL_TIMES] = H.RCL_TIMES_FF;
M[I][H.RCL_DIVIDE] = H.RCL_DIVIDE_FF;
M[I][0] = H.FF;

I = 43;

M[I][0] = H.GG;
M[I][H.STO] = H.STO_GG;
M[I][H.RCL] = H.RCL_GG;

I = 44;

K[I][H.FF] = H.make_closure("frac", [], "FRAC");
K[I][H.GG] = H.make_closure("intg", [], "INTG");
M[I][0] = H.STO;

I = 45;

K[I][H.GG] = H.make_closure("mem_info", [], "MEM");
K[I][H.GG].no_pgrm = 1;
K[I][H.FF] = H.make_closure("toggle_user", [], "TOGGLE USER");
K[I][H.FF].no_pgrm = 1;

M[I][0] = H.RCL;
M[I][H.RCL] = H.RCL_FF;

I = 0;

K[I][H.FF] = H.make_closure("fatorial", [], "N!");
K[I][H.GG] = H.make_closure("stat_avg", [], "STAT AVG");

I = 48;

K[I][H.GG] = H.make_closure("stat_stddev", [], "STAT STDDEV");
K[I][H.FF] = H.make_closure("stat_lr", [0], "STAT LR Y");
K[I][0] = H.make_closure("decimal_point_mode", [], ".");

M[I][H.STO] = H.STO2;
M[I][H.RCL] = H.RCL2;
M[I][H.LBL] = H.LBL_DOT;
M[I][H.GTO] = H.GTO_DOT;
M[I][H.GSB] = H.GSB_DOT;
M[I][H.SOLVE] = H.SOLVE_DOT;
M[I][H.INTEG] = H.INTEG_DOT;
M[I][H.FF_EXCHANGE] = H.FF_EXCHANGE_DOT;
M[I][H.STO_DIVIDE] = H.STO_DIVIDE_DOT;
M[I][H.STO_TIMES] = H.STO_TIMES_DOT;
M[I][H.STO_MINUS] = H.STO_MINUS_DOT;
M[I][H.STO_PLUS] = H.STO_PLUS_DOT;
M[I][H.RCL_DIVIDE] = H.RCL_DIVIDE_DOT;
M[I][H.RCL_TIMES] = H.RCL_TIMES_DOT;
M[I][H.RCL_MINUS] = H.RCL_MINUS_DOT;
M[I][H.RCL_PLUS] = H.RCL_PLUS_DOT;
M[I][H.ISG] = H.ISG_DOT;
M[I][H.DSE] = H.DSE_DOT;

I = 49;

K[I][H.RCL] = H.make_closure("stat_sigma_rcl", [], "RCL STAT S+");
K[I][H.FF] = H.make_closure("stat_linearregression", [], "STAT LR");
K[I][H.GG] = H.make_closure("stat_sigma_minus", [], "STAT S-");
K[I][H.STO] = H.make_closure("stat_sigma_plus", [], "STO STAT S+");
K[I][H.STO].reducible = true;
K[I][H.STO].reduced_modifier = 0;
K[I][0] = H.make_closure("stat_sigma_plus", [], "STAT S+");

I = 40;

K[I][0] = H.make_closure("plus", [], "+");
M[I][H.STO] = H.STO_PLUS;
M[I][H.RCL] = H.RCL_PLUS;
K[I][H.FF] = H.make_closure("permutations", [1], "PERM");
K[I][H.GG] = H.make_closure("combinations", [1], "COMB");

I = 50;

// This is just to satisfy STOP_INSTRUCTION in 11C
K[I][0] = H.make_closure("nop", [], "NOP");

// remove from scope
M = undefined;
K = undefined;
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H, Hp12c_dispatcher */

"use strict";

Hp12c_dispatcher.prototype.handle_modifier = function (key, pgrm_mode, exec_mode)
{
	var modifier_table = this.modifier_sm[key];
	var f = this.find_function(key, 0, 1, exec_mode);

	if (H.type !== "15c") {
		if (H.machine.modifier == H.STO_FF || H.machine.modifier == H.RCL_FF) {
			// this is always final, no modifier here
			return false;
		}
	}

	if (modifier_table) {
		var next_modifier = modifier_table[H.machine.modifier];
		if (next_modifier) {
			// a modifier potentialized by a previous one
			H.machine.set_modifier(next_modifier);
			return true;
		} else if (modifier_table[0] && !f) {
			// a modifier of its own right, like f, g
			H.machine.set_modifier(modifier_table[0]);
			return true;
		}
	}

	return false;
};

Hp12c_dispatcher.prototype.find_function = function (key, pgrm_mode, query, exec_mode)
{
	var function_table = this.functions[key];
	var f = null;

	if (!function_table) {
		return null;
	}

	f = function_table[H.machine.modifier];

	if (f) {
		if (f.reducible) {
			// Handle cases like STO PLUS f I, STO f I
			// make opcode like STO I and STO PLUS I
			H.machine.set_modifier(f.reduced_modifier);
			f = function_table[H.machine.modifier];
		}
	}

	if (!f) {
		// no function given current modifier
		if (query === 1) {
			return null;
		}

		if (H.machine.modifier == H.STO_FF ||
				H.machine.modifier == H.RCL_FF ||
				H.machine.modifier == H.STO_PLUS_FF ||
				H.machine.modifier == H.STO_MINUS_FF ||
				H.machine.modifier == H.STO_TIMES_FF ||
				H.machine.modifier == H.STO_DIVIDE_FF) {
			// give a chance to plain F
			f = function_table[H.FF];
			if (f && query === 0) {
				H.machine.set_modifier(H.FF);
			}
		}
	}

	if (!f) {
		// try plain key without any modifier
		f = function_table[0];
		if (f && query === 0) {
			H.machine.rst_modifier(1);
		}
	}

	if (pgrm_mode && f && f.no_pgrm) {
		// this function can not be programmed; revoked
		f = null;
	}

	return f;
};

Hp12c_dispatcher.prototype.dispatch = function (key)
{
	// this is used when a real key is pressed

	if (key == 99) {
		H.debug.show_memory();
		return;
	}

	if (H.machine.error_in_display) {
		H.machine.reset_error();
		return;
	} else if (H.machine.program_mode >= H.RUNNING) {
		H.pgrm.stop(1);
		return;
	}

	// Determine key function early, because we need that in USER logic
	var f_mod = this.find_function(key, 0, 1, false);
	var f = f_mod;
	var tmp = H.machine.modifier;

	if (!f) {
		H.machine.modifier = 0;
		f = this.find_function(key, 0, 1, false);
		H.machine.modifier = tmp;
	}

	// USER logic - may change modifier
	if (key >= 11 && key <= 15) {
		if (H.machine.user) {
			if (H.machine.modifier == H.FF) {
				// USER + f = natural
				H.machine.modifier = 0;
			} else if (H.machine.modifier == H.STO_FF ||
					H.machine.modifier == H.RCL_FF ||
					H.machine.modifier == H.STO_PLUS_FF ||
					H.machine.modifier == H.STO_MINUS_FF ||
					H.machine.modifier == H.STO_TIMES_FF ||
					H.machine.modifier == H.STO_DIVIDE_FF) {
				// USER + f = natural
				H.machine.modifier = 0;
			} else if (H.machine.modifier === 0) {
				// USER + no modifier = f
				H.machine.modifier = H.FF;
			} else if (! f_mod) {
				// USER + invalid modifier -> f
				H.machine.modifier = H.FF;
			}
			// GSB [A-F] and GTO [A-F] not affected because
			// GSB and GTO are modifiers different from the ones
			// handled above.
		} else {
			// natural course
		}
	}

	// Programming mode?

	if (H.machine.program_mode == H.PROGRAMMING) {
		H.pgrm.type(key);
		return;
	}

	this.dispatch_common(key, false);
};

Hp12c_dispatcher.prototype.dispatch_common = function (key, in_exec)
{
	var ok = 1;

	if (this.handle_modifier(key, 0, in_exec)) {
		return ok;
	}

	// key is not modifier in this context, try a function

	var f = this.find_function(key, 0, 0, in_exec);

	if (!f) {
		// no-op
		f = function () { };
		ok = false;
	}

	var rst_modifier = 1;

	if (f.dont_rst_modifier) {
		rst_modifier = 0;
	}

	f();

	if (rst_modifier) {
		H.machine.rst_modifier(1);
	}

	return ok;
};
H.asm_reverse_map = null;
H.asm_ucode_reverse_map = null;

H.asm_make_reverse_map = function ()
{
	var map = {};
	var umap = {};
	H.asm_reverse_map = map;
	H.asm_ucode_reverse_map = umap;

	var K = Hp12c_dispatcher.prototype.functions;

	// pure modifier keys, with no K[key][0]
	umap.FF = 42;
	umap.GG = 43;
	umap.STO = 44;
	umap.RCL = 45;
	if (H.type === "16c") {
		umap.GSB = 21;
		umap.LBL = 22;
		umap.GTO = 22;
	} else if (H.type === "11c" || H.type === "15c") {
		umap.GTO = 22;
		umap.GSB = 32;
		umap.LBL = 21;
		umap.A = 11;
		umap.B = 12;
		umap.C = 13;
		umap.D = 14;
		umap.E = 15;
	} else { // 12c
		umap.GTO = 33;
	}

	for (var key in K) {
		if (K.hasOwnProperty(key)) {
			for (var modifier in K[key]) {
				if (K[key].hasOwnProperty(modifier)) {
					var closure = K[key][modifier];
					if (! closure.asm) {
						continue;
					}
					var imodifier = modifier;
					var ikey = key;
					if (closure.reducible) {
						if (imodifier >= 10000) {
							// 11C, 15C: this key sequence cannot
							// be translated to an opcode, since it
							// is reduced before goes to RAM
							continue;
						}
					}
					
					var is_addr = false;
					var mnemonic = closure.asm.toUpperCase();
					var opcode = Hp12c_pgrm.p_encode_instruction(parseInt(imodifier, 10),
											parseInt(ikey, 10),
											is_addr);
					if (map[mnemonic]) {
						throw "Mnemonic already exists: " + mnemonic +
							" existing code " + map[mnemonic] + " " +
							" other code " + opcode;
					}
					map[mnemonic] = opcode;
					// iterating over K yields string keys
					umap[mnemonic] = parseInt(key, 10);
				}
			}
		}
	}

	console.log("Making asm done");
};

H.asm_condition = function (s)
{
	s = H.trim(s).toUpperCase();
	return s.replace(/\s{2,}/g, ' ');
};

H.asm_gto12 = function (s) 
{
	var regex_gto12 = new RegExp('^GTO [0-9]+$');

	if (! regex_gto12.test(s)) {
		return null;
	}

	var ip = 0 + s.substr(4);
	if (ip >= H.ram_MAX) {
		console.log("IP too high: " + s);
		return null;
	}

	return Hp12c_pgrm.p_encode_instruction(parseInt(4333, 10),
						parseInt(ip, 10),
						true);
};

H.asm = function (instr, query)
{
	if (! H.asm_reverse_map) {
		H.asm_make_reverse_map();
	}

	var map = H.asm_reverse_map;

	var c12 = H.is_12c();

	instr = H.asm_condition(instr);
	var opcode = null;

	if (map[instr]) {
		opcode = map[instr];
	} else if (c12 && H.asm_gto12(instr)) {
		opcode = H.asm_gto12(instr);
	} else {
		if (! query) {
			throw "asm: Invalid instruction: " + instr;
		}
	}

	return opcode;
};

H.asm_microcode = function (ucodename, query)
{
	if (! H.asm_reverse_map) {
		H.asm_make_reverse_map();
	}

	ucodename = H.asm_condition(ucodename);

	if (H.asm_ucode_reverse_map[ucodename] === undefined ||
			H.asm_ucode_reverse_map[ucodename] === null) {
		if (! query) {
			throw ">>>> Invalid microcode " + ucodename;
		}
		return null;
	}

	return H.asm_ucode_reverse_map[ucodename];
};

H.asm_expand = function (progr)
{
	var result = [];
	var regex_number = new RegExp('^[0-9.]+$');

	for (var i = 0; i < progr.length; ++i) {
		var instr = progr[i];
		if (H.asm(instr, true)) {
			result.push(instr);
		} else if (regex_number.test(instr)) {
			for (var j = 0; j < instr.length; ++j) {
				result.push(instr.charAt(j));
			}
		} else {
			result.push(instr);
		}
	}

	return result;
};

H.asm_microcode_expand = function (progr)
{
	var result = [];
	var regex_number = new RegExp('^[0-9.]+$');

	for (var i = 0; i < progr.length; ++i) {
		var instr = progr[i];
		if (instr === null) {
			// skip
		} else if (H.asm_microcode(instr, true)) {
			result.push(instr);
		} else if (regex_number.test(instr)) {
			for (var j = 0; j < instr.length; ++j) {
				result.push(instr.charAt(j));
			}
		} else {
			result.push(instr);
		}
	}

	return result;
};

H.asm_compile = function (progr, base_addr)
{
	progr = H.asm_expand(progr);

	for (var i = 0; i < progr.length; ++i) {
		H.machine.ram[base_addr + i + 1] = H.asm(progr[i]);
	}

	return progr.length;
};

H.asm_microcode_exec = function (microcode, monitor)
{
	for (var i = 0; i < microcode.length; ++i) {
		H.dispatcher.dispatch(microcode[i]);
		printf("Typed " + microcode[i] + " " + H.machine.x);
		if (monitor) {
			monitor(i);
		}
	}
};

/*
Assembly = whole instructions
Microcode = actual keystrokes
Example:
	"STO 0" is an assembly instruction
	It compiles to opcode "44.00"
	Microcode/keystrokes would be [44, 00].
Microcode is useful to simulate program typing, among
other things.
*/
H.asm_microcode_compile = function (microprogram)
{
	microprogram = H.asm_microcode_expand(microprogram);
	var microcode = [];

	for (var i = 0; i < microprogram.length; ++i) {
		microcode[i] = H.asm_microcode(microprogram[i]);
	}

	return microcode;
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

H.INTERPOLATION_MAX = 100;

H.solve_infinity = function (val)
{
	if (val > Math.pow(10, 95)) {
		val = Math.pow(10, 95);
	} else if (val < -Math.pow(10, 95)) {
		val = -Math.pow(10, 95);
	}
	return val;
};

H.npv = function (n, i, cfj, nj)
{
	var res = cfj[0];
	var pmt = 0;
	for (var e = 1; e <= n; ++e) {
		var cf = cfj[e];
		for (var f = 1; f <= nj[e]; ++f) {
			++pmt;
			res += cf / Math.pow(1 + (i / 100), pmt);
		}
	}
	return res;
};

H.npv_quality = function (n, cfj, nj)
{
	var sgn = 0;

	if (cfj[0] > 0) {
		sgn = 1;
	} else if (cfj[0] < 0) {
		sgn = -1;
	}
	
	for (var e = 1; e <= n; ++e) {
		if (nj[e] !== 0) {
			var newsgn = 0;
			if (cfj[e] > 0) {
				newsgn = 1;
			} else if (cfj[e] < 0) {
				newsgn = -1;
			}
			if (newsgn !== 0) {
				if (sgn !== 0) {
					if (newsgn !== sgn) {
						// signal inversion, exit with sucess
						return +1;
					}
				}
				sgn = newsgn;
			}
		}
	}

	// no signal inversions, or all-zeros
	return (sgn === 0) ? 0 : -1;
};

H.comppmtlim = function (i, n)
{
	if (Math.abs(i) < 0.0000000001) {
		return n;
	} else {
		return (1 - Math.pow(1 + (i / 100), -n)) / (i / 100);
	}
};

H.calcNPV = function (is_n, n, i, pv, pmt, fv, begin, compoundf)
{
	if (n == Math.floor(n) || is_n) {
		return pv + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, n) + 
			fv * Math.pow(1 + (i / 100), -n);
	} else if (! compoundf) {
		return pv * (1 + ((i / 100) * (n - Math.floor(n)))) + 
			(1 + (i / 100) * (begin ? 1:0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * Math.pow(1 + (i / 100), -Math.floor(n));
	} else {
		return pv * Math.pow(1 + (i / 100), (n - Math.floor(n))) + 
			(1 + (i / 100) * (begin ? 1 : 0)) * pmt * H.comppmtlim(i, Math.floor(n)) +
			fv * Math.pow(1 + (i / 100), -Math.floor(n));
	}
};

H.bond_previous_coupon = function (buy, maturity)
{
	// calculates last coupon paid just before buy

	var coupons = 0;
	var last_coupon = new Date(maturity);
	var next_coupon;

	while (last_coupon > buy) {
		next_coupon = new Date(last_coupon);
		++coupons;
		last_coupon.setDate(1);
		last_coupon.setMonth(last_coupon.getMonth() - 6);
		var month = last_coupon.getMonth();
		last_coupon.setDate(maturity.getDate());
	
		if (last_coupon.getMonth() != month) {
			// day > 28, overflowed into next month
			// Javascript trick: set to day 0 goes to last day of previous month
			// last_coupon.setDate(0);
			
			// We *could* do this calculation, but HP-12C returns Error 8 in this case,
			// so do we
			return null;
		}
	}

	return [last_coupon, next_coupon, coupons];
};

H.bond_price = function (desired_rate, coupon_year, buy, maturity)
{
	var price;
	var tot_interest;

	// * HP-12C only calculates semi-annual bonds i.e. bonds which pay coupons every 6 mo
	// * Value paid at maturity is always = 100

	// desire rate is pre-checked to be > -100

	var coupon_date = maturity;
	var tottime = H.date_diff(buy, maturity); 

	if (tottime <= 0) {
		return [H.ERROR_DATE, 0, 0];
	}

	var res = H.bond_previous_coupon(buy, maturity);

	if (res === null) {
		return [H.ERROR_DATE, 0, 0];
	}

	var E = H.date_diff(res[0], res[1]);
	var dsc = H.date_diff(buy, res[1]);	// time between settlement (buying) and next coupon
	var coupons = res[2];			// coupons that will be paid until maturity
	var dcs = E - dsc;			// time since last coupon, paid before we bought it.

	if (tottime <= E) {
		price = (100 * (100 + coupon_year / 2)) / (100 + ((tottime / E) * desired_rate / 2)); // present-value price
	} else {
		price = 100 / Math.pow(1 + desired_rate / 200, coupons - 1 + dsc / E); // present-value price
		for (var e = 1; e <= coupons; ++e) {
			// accumulate present value of all future coupons
			price += (coupon_year / 2) / Math.pow(1 + desired_rate / 200, e - 1 + dsc / E); 
		}
	}
	tot_interest = (coupon_year / 2) * dcs / E;
	price -= tot_interest; // coupon fraction compound before we bought it

	// should never happen, since previous checkings avoid NaN cases
	price = H.solve_infinity(price) || 0;
	tot_interest = H.solve_infinity(tot_interest) || 0;

	return [-1, price, tot_interest];
};

H.irr_npvsum = function (n, cfj)
{
	var res = Math.abs(cfj[0]);
	for (var e = 1; e <= n; ++e) {
		res += Math.abs(cfj[e]);
	}
	return res;
};

H.irr_calc = function (n, i, cfj, nj)
{
	var quality = H.npv_quality(n, cfj, nj);

	if (quality === 0) {
		// all-zeros
		return [-1, 0];
	} else if (quality < 0) {
		// all data have the same signal
		return [H.ERROR_IRR, i];
	}

	var NPVA, NPVL, NPVH, guessL, guessH;
	var threshold = 0.0000000000125;
	var threshold_order = H.irr_npvsum(n, cfj);

	if (threshold_order > 0) {
		threshold *= threshold_order;
	}

	if (i <= -98 || i > 10000000000) {
		i = 0;
	}
	guessL = i - 1;
	guessH = i + 1;

	var success = false;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// console.log("Trying interval " + guessL + " " + guessH);
		NPVH = H.npv(n, guessH, cfj, nj);
		NPVL = H.npv(n, guessL, cfj, nj);

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		var diff = guessH - guessL;
		if (guessL < 0) {
			guessL = Math.max(-99.99999999, guessL * 1.5); // counting with 100 iterations
		} else {
			guessL = Math.max(-99.99999999, guessL - 5 * diff); // counting with 100 iterations
		}
		guessH = Math.min(guessH + 5 * diff, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// console.log("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			NPVA = H.npv(n, avg, cfj, nj);
	
			if (Math.abs(NPVA) < threshold) {
				return [-1, avg];
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// console.log("Interval NPV is " + NPVL + " " + NPVH);
		}
	}
	
	return [H.ERROR_IRR2, i];
};

H.financecalc = function (dependent, begin, compoundf, finarray)
{
	var err = 0;
	if (dependent === 0) {
		// n
		var tpmt = finarray[H.FIN_PMT];
		var tpvi = -finarray[H.FIN_PV] * finarray[H.FIN_I] / 100;
		var tfvi = finarray[H.FIN_FV] * finarray[H.FIN_I] / 100;
		var tfv = finarray[H.FIN_FV];
		if (tpmt < 0) {
			tpmt = -tpmt;
			tpvi = -tpvi;
			tfvi = -tfvi;
			tfv = -tfv;
		}
		
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
		// "if" is kludge to work around a problem with PMT = 0 and FV != 0
		if (tfv === 0) {
			err = err || (tpmt <= tpvi); // PMT <= -VP x i
			err = err || H.feq10(tpmt, tpvi); // PMT <= -VP x i
		}
		// I am in doubt in relation to signal
		// err = err || H.feq10(tpmt, tfvi); // PMT == VF x i
	} else if (dependent == 1) {
		var pmtn = finarray[H.FIN_PMT] * finarray[H.FIN_N];
		err = err || (finarray[H.FIN_N] < 0);
		err = err || (pmtn >= 0 && finarray[H.FIN_PV] >= 0 && finarray[H.FIN_FV] >= 0);
		err = err || (pmtn <= 0 && finarray[H.FIN_PV] <= 0 && finarray[H.FIN_FV] <= 0);
	} else if (dependent == 2) {
		// PV
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
	} else if (dependent == 3) { 
		// PMT
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
		err = err || finarray[H.FIN_N] === 0; // n = 0
	} else if (dependent == 4) {
		// FV
		err = err || finarray[H.FIN_I] <= -100; // i <= -100
	}

	if (err) {
		return H.ERROR_INTEREST;
	}

	var threshold = 0.00000000000125;
	var threshold_order = 0;

	// correct threshold so it is more "lax" when involved numbers are too big
	if (dependent != H.FIN_PV) {
		threshold_order += Math.abs(finarray[H.FIN_PV]);
	}
	if (dependent != H.FIN_PMT) {
		threshold_order += Math.abs(finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_N && dependent != H.FIN_PMT) {
		threshold_order += Math.abs(finarray[H.FIN_N] * finarray[H.FIN_PMT]);
	}
	if (dependent != H.FIN_FV) {
		threshold_order += Math.abs(finarray[H.FIN_FV]);
	}
	if (threshold_order > 0) {
		threshold *= threshold_order;
	}

	if (dependent === 1) {
		return H.financecalc_i(dependent, begin, compoundf, finarray, threshold, threshold_order);
	}

	var guess0, guess1, NPV0, NPV1;
	var saved = finarray[dependent];
	var iteration = H.INTERPOLATION_MAX;

	guess0 = null;

	if (dependent == H.FIN_N || dependent == H.FIN_I || threshold_order <= 0) {
		guess1 = 1;
	} else {
		// initial guess for interpolation must be of same order as other parameters
		guess1 = threshold_order;
	}

	var ret = H.ERROR_INTEREST;

	while (--iteration >= 0) {
		finarray[dependent] = guess1;

		NPV1 = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		if (Math.abs(NPV1) < threshold) {
			if (dependent === 0) {
				if ((guess1 - Math.floor(guess1)) > 0.003) {
					finarray[dependent] = Math.floor(finarray[dependent]) + 1;
				} else {
					finarray[dependent] = Math.floor(finarray[dependent]);
				}
			}
			saved = finarray[dependent];
			ret = -1;
			break;
		}

		var new_guess = guess1 + 1;

		if (guess0 !== null) {
			var B = (NPV1 - NPV0) / (guess1 - guess0); // B
			new_guess = NPV0 - guess0 * B; // A
			new_guess /= -B; // -A/B is the interpolation root
			new_guess = H.solve_infinity(new_guess);
		}

		guess0 = guess1;
		NPV0 = NPV1;
		guess1 = new_guess;
		NPV1 = null;
	}

	// puts back the original value in case of error,
	// since the calculated one may be NaN
	finarray[dependent] = saved;
	return ret;
};

// separate routine since linear interpolation does not work well for i
H.financecalc_i = function (dependent, begin, compoundf, finarray, threshold, threshold_order)
{
	var NPVA, NPVL, NPVH, guessL, guessH;
	var saved = finarray[dependent];

	var ret = H.ERROR_INTEREST;

	var success = false;

	guessL = -1;
	guessH = +1;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// console.log("Trying interval " + guessL + " " + guessH);
		finarray[dependent] = guessH;
		NPVH = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		finarray[dependent] = guessL;
		NPVL = H.calcNPV(dependent === 0,
				finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
				finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);

		// console.log("Interval NPV is " + NPVL + " " + NPVH);

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		guessL = Math.max(-99.99999999, guessL - 1.1); // counting with 100 iterations
		guessH = Math.min(guessH * 10, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// console.log("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			finarray[dependent] = avg;
			NPVA = H.calcNPV(dependent === 0,
					finarray[H.FIN_N], finarray[H.FIN_I], finarray[H.FIN_PV], 
					finarray[H.FIN_PMT], finarray[H.FIN_FV], begin, compoundf);
	
			if (Math.abs(NPVA) < threshold) {
				return -1;
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// console.log("Interval NPV is " + NPVL + " " + NPVH);
		}
	}
	
	finarray[dependent] = saved;
	return ret;
};

H.bond_yield = function (coupon_year, buy, maturity, price)
{
	if (buy === null) {
		return [H.ERROR_DATE, 0];
	}

	if (maturity === null) {
		return [H.ERROR_DATE, 0];
	}

	if (price <= 0) {
		return [H.ERROR_INTEREST, 0];
	}

	var NPVA, NPVL, NPVH, guessL, guessH;
	var threshold = 0.000000000125 * Math.abs(price);

	guessL = -1;
	guessH = +1;

	var success = false;
	var err = H.ERROR_INTEREST;

	// find an interval guessL..guessH that contains NPV = 0
	var iteration = H.INTERPOLATION_MAX;
	while (--iteration >= 0) {
		// console.log("Trying interval " + guessL + " " + guessH);
		NPVL = H.bond_price(guessL, coupon_year, buy, maturity);
		if (NPVL[0] >= 0) {
			err = NPVL[0];
			break;
		}
		NPVL = NPVL[1] - price;
		NPVH = H.bond_price(guessH, coupon_year, buy, maturity);
		/*
		Impossible, because all possible errors are related to date and
		are caught in NPVL calculation.

		if (NPVH[0] >= 0) {
			err = NPVH[0];
			break;
		}
		*/
		NPVH = NPVH[1] - price;

		// success condition
		if ((NPVH * NPVL) < 0) {
			success = true;
			break;
		}

		guessL = Math.max(-199.99999999, guessL * 1.5); // counting with 100 iterations
		guessH = Math.min(guessH * 10, 1e99);
	}

	if (success) {
		// Now bisect to find NPV(guess) = 0
		iteration = H.INTERPOLATION_MAX;
		while (--iteration >= 0) {	
			// console.log("Trying bisection " + guessL + " " + guessH);
			var avg = (guessL + guessH) / 2;
			NPVA = H.bond_price(avg, coupon_year, buy, maturity);
			/*
			Impossible, because all possible errors would have been
			caught in previous loop, in NPVL calculation.

			if (NPVA[0] >= 0) {
				err = NPVA[0];
				break;
			}
			*/
			NPVA = NPVA[1] - price;
	
			if (Math.abs(NPVA) < threshold) {
				return [-1, avg];
			}
	
			if ((NPVL * NPVA) < 0) {
				// zero between L and avg
				NPVH = NPVA;
				guessH = avg;
			} else {
				// zero between avg and H
				NPVL = NPVA;
				guessL = avg;
			}
	
			// console.log("Interval NPV is " + NPVL + " " + NPVH);
		}
	}

	return [err, 0];
};

H.depreciation_sl = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life) {
		// bail out early to avoid slowness if year is absurdly big
		// linear depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	while (--year >= 0) {
		depr = (cost - sell) / life;
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_soyd = function (cost, sell, life, year)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life) {
		// bail out early to avoid slowness if year is absurdly big
		// soyd depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	var year_up = 0;
	var soyd = life * (life + 1) / 2;

	while (--year >= 0) {
		depr = (cost - sell) * (life - (++year_up) + 1) / soyd;
		rest -= depr;
	}

	return [-1, depr, rest];
};

H.depreciation_db = function (cost, sell, life, year, db)
{
	var depr = 0;
	var rest = cost - sell;

	if (year < 0 || year != Math.floor(year) || life <= 0 || life > Math.pow(10, 10)) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	if (year > life || rest < 0) {
		// bail out early to avoid slowness if year is absurdly big
		// soyd depreciation does not make sense if year > life
		return [-1, 0, 0];
	}

	var birthday = 0;

	while (--year >= 0) {
		if (++birthday < life) {
			depr = (rest + sell) * db / life;
		} else {
			depr = rest;
		}
		rest -= depr;

		if (rest < 0) {
			// may happen if db is big
			depr += rest;
			rest = 0;
		}
	}

	return [-1, depr, rest];
};

H.amortization = function (requested_n, orig_n, i, pv, pmt, decimals, begin)
{
	if (requested_n <= 0 || requested_n != Math.floor(requested_n) || i <= -1) {
		return [H.ERROR_INTEREST, 0, 0];
	}

	var tot_interest = 0;
	var tot_amort = 0;

	for (var e = 1; e <= requested_n; ++e) {
		var interest = H.cl5_round(-pv * i, decimals);
		if (e == 1 && begin && orig_n <= 0) {
			// front payment has no interest
			interest = 0;
		}
		var capital_amortization = pmt - interest;
		tot_interest += interest;
		tot_amort += capital_amortization;
		pv += capital_amortization;
	}

	return [-1, tot_interest, tot_amort];
};

H.degrees_to_radians = function (angle)
{
	return angle * Math.PI / 180;
};

H.radians = function (angle, mode) // 11C
{
	if (mode == H.TRIGO_DEG) {
		angle = H.degrees_to_radians(angle);
	} else if (mode == H.TRIGO_GRAD) {
		angle *= Math.PI / 200;
	}
	return angle;
};

H.radians_to_degrees = function (angle)
{
	return angle * 180 / Math.PI;
};

H.to_angle_mode = function (angle, mode) // 11C
{
	if (mode == H.TRIGO_DEG) {
		angle = H.radians_to_degrees(angle);
	} else if (mode == H.TRIGO_GRAD) {
		angle *= 200 / Math.PI;
	}
	return angle;
};

H.hour_to_hms = function (hour)
{
	var sgn = H.binary_sgn(hour);
	var whole_hour = Math.floor(Math.abs(hour));
	var fraction = Math.abs(hour) - whole_hour;
	fraction *= 60;
	// avoid leaving a 0.999... fraction behind
	var minutes = Math.floor(fraction + 0.00000001);
	// make sure it does not get negative
	fraction = Math.max(fraction - minutes, 0);
	var seconds = fraction * 60;
	return sgn * (whole_hour + minutes / 100 + seconds / 10000);
};

H.hms_to_hour = function (hour)
{
	var sgn = H.binary_sgn(hour);
	var whole_hour = Math.floor(Math.abs(hour));
	var fraction = Math.abs(hour) - whole_hour;
	fraction *= 100;
	// avoid leaving a 0.999... fraction behind
	var minutes = Math.floor(fraction + 0.0000001);
	// make sure it does not get negative
	fraction = Math.max(fraction - minutes, 0);
	var seconds = fraction * 100;
	return sgn * (whole_hour + minutes / 60 + seconds / 3600);
};

// hyperbolic functions from http://phpjs.org/functions/

H.asinh = function (arg) {
	return Math.log(arg + Math.sqrt(arg * arg + 1));
};

H.acosh = function (arg) {
	return Math.log(arg + Math.sqrt(arg * arg - 1));
};

H.atanh = function (arg) {
	return 0.5 * Math.log((1 + arg) / (1 - arg));
};

H.sinh = function (arg) {
	return (Math.exp(arg) - Math.exp(-arg)) / 2;
};

H.cosh = function (arg) {
	return (Math.exp(arg) + Math.exp(-arg)) / 2;
};

H.tanh = function (arg) {
	return (Math.exp(arg) - Math.exp(-arg)) / (Math.exp(arg) + Math.exp(-arg));
};

H.feq = function (a, b, epsilon) {
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		// console.log("feq: bad number");
		return false;
	}

	if (epsilon === undefined || epsilon === null) {
		epsilon = Math.pow(10, -10);
	}

	/*
	// convert numbers into intervals
	var A = a - epsilon;
	var B = a + epsilon;
	var X = b - epsilon;
	var Y = b + epsilon;

	// interval equality
	// return B >= X && A <= Y;
	// if numbers are negative, (A,B) (X,Y) will not be in order!
	return (A >= X && A <= Y) || (B >= X && B <= Y);
	*/

	// printf(" " + a + " " + b + " " + epsilon + " " + Math.abs(a - b) +
	// (Math.abs(a - b) < epsilon));

	return Math.abs(a - b) <= epsilon;
};

H.arithmetic_round = function (r, a, b)
{
	if (r === 0) {
		// nothing to round
		return r;
	} else if (a === 0 && b === 0) {
		// both zeros or no rounding desired (mult, div, power)
		return r;
	}

	var r_order = Math.floor(Math.log(Math.abs(r)) / Math.log(10));
	var order = r_order;

	// pick the magnitude of biggest number in operation
	if (a !== 0) {
		order = Math.floor(Math.log(Math.abs(a)) / Math.log(10));
	}
	if (b !== 0) {
		order = Math.max(order, Math.floor(Math.log(Math.abs(b)) / Math.log(10)));
	}

	var scale = Math.pow(10, order - 15);

	if (Math.abs(r) < scale) {
		r = 0;
	}

	return r;
};

H.feq10 = function (a, b) {
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		return false;
	}

	var epsilon = 0; // exact comparison

	if (a === 0 || b === 0) {
		// comparison with pure zero is special case
		epsilon = Math.pow(10, -100);
	} else {
		var order = Math.floor(Math.max(Math.log(Math.abs(b)) / Math.log(10),
				       Math.log(Math.abs(a)) / Math.log(10))) + 1;

		// OR just in case order is NaN (probably never)
		epsilon = Math.pow(10, order - 10) || Math.pow(10, -100);
	}

	return H.feq(a, b, epsilon);
};

H.feq_digits = function (a, b, precision_digits, epsilon, log)
{
	if (a === undefined || a === null || b === undefined || b === null ||
					H.badnumber(a) || H.badnumber(b)) {
		return false;
	}

	if (! epsilon) {
		epsilon = 5;
	}

	precision_digits = Math.min(precision_digits, 10);

	var magnitude;

	// effectively moving the magnitude to zero
	while (a === 0 || b === 0) {
		a += 1;
		b += 1;
	}

	var magnitude_b = Math.log(Math.abs(b)) / Math.log(10);
	var magnitude_a = Math.log(Math.abs(a)) / Math.log(10);
	magnitude = Math.max(magnitude_a, magnitude_b);

	// Just in case magnitude is NaN
	magnitude = (Math.floor(magnitude) + 1) || 0;

	epsilon *= Math.pow(10, magnitude - precision_digits - 1);

	if (log) {
		console.log(" feq_digits " + a + " " + b + " " + (a - b) + " mag=" +
				magnitude + " d=" + precision_digits +
				" e=" + epsilon + " res " +
				H.feq(a, b, epsilon));
	}

	return H.feq(a, b, epsilon);
};

// comparision with 10^-10 tolerance when one of the values tend to zero
H.feq10_0 = function (a, b)
{
	var offset = 0;
	if ((a <= 1 && a >= -1) || (b <= 1 && b >= -1)) {
		offset = 2;
	}
	return H.feq10(offset + a, offset + b);
};

H.polar = function (x, y) {
	var angle = Math.atan2(y, x); // does not throw NaN
	var r = Math.sqrt(x * x + y * y);
	return [r, angle];
};

H.orthogonal = function (r, angle)
{
	return [r * H.cos(angle), r * H.sin(angle)];
};

H.fatorial = function (n)
{
	var res = 1;
	while (n > 1 && ! H.badnumber(res)) {
		res *= n;
		--n;
	}
	return res;
};

// from Wikipedia
H.gamma = function (z) {
	if (z < 0.5) {
		return Math.PI / (Math.sin(Math.PI * z) * H.gamma(1 - z));
	}
	z = z - 1;
	var x = H.gamma.p[0];
	for (var i = 1; i < (H.gamma.g + 2); ++i) {
		x += H.gamma.p[i] / (z + i);
	}
	var t = z + H.gamma.g + 0.5;
	return Math.sqrt(2 * Math.PI) * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
};

H.gamma.g = 7;
H.gamma.p = [0.99999999999980993, 676.5203681218851,
	-1259.1392167224028, 771.32342877765313, -176.61502916214059,
	12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
	1.5056327351493116e-7];

H.fatorial_gamma = function (n)
{
	if (n >= 0 && Math.floor(n) == n) {
		return H.fatorial(n);
	}
	return H.gamma(n + 1);
};

H.permutations = function (a, b)
{
	return H.fatorial(a) / H.fatorial(a - b);
};

H.combinations = function (a, b)
{
	return H.permutations(a, b) / H.fatorial(b);
};

H.stddev = function (mem)
{
	if (mem[H.STAT_N] <= 1 || 
	    (mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]) < 0 ||
	    (mem[H.STAT_N] * mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y]) < 0) {
		return [0];
	}
	var x = Math.pow((mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]) /
			 (mem[H.STAT_N] * (mem[H.STAT_N] - 1)), 0.5);
	var y = Math.pow((mem[H.STAT_N] * mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y]) /
			 (mem[H.STAT_N] * (mem[H.STAT_N] - 1)), 0.5);
	return [1, x, y];
};

H.linear_regression = function (mem)
{
	if (mem[H.STAT_N] <= 1) {
		// console.log("LR err type 1");
		return [0];
	}

	var div = mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];
	if (H.feq10_0(div, 0)) {
		// console.log("LR err type 2");
		return [0];
	}

	// TODO implement test [ n Ex2 - (Ex)2] [ n Ey2 - (Ey)2] <= 0

	var avgx = mem[H.STAT_X] / mem[H.STAT_N];
	var avgy = mem[H.STAT_Y] / mem[H.STAT_N];

	var B = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	B /= div;
	B = H.solve_infinity(B) || 0;

	var A = avgy - B * avgx;

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	return [1, A, B];
};

H.stat_kr = function (mem, is_x, xx)
{
	var res = H.linear_regression(mem);

	if (! res[0]) {
		// console.log("statkr error 1");
		return [0];
	}

	var A = res[1];
	var B = res[2];

	// note: vars are following the HP12C handbook convention
	// y=Bx+A, while the 11C and math convention is y=Ax+B.

	// an equivalent test is already made at linear_regression()
	/*
	if (H.feq((mem[H.STAT_N] * mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X]), 0)) {
		console.log("statkr error 2");
		return [0];
	}
	*/

	var rr3 = mem[H.STAT_Y2] - mem[H.STAT_Y] * mem[H.STAT_Y] / mem[H.STAT_N];

	if (H.feq10_0(rr3, 0)) {
		// console.log("statkr error 3");
		return [0];
	}

	var rr1 = mem[H.STAT_XY] - mem[H.STAT_X] * mem[H.STAT_Y] / mem[H.STAT_N];
	var rr2 = mem[H.STAT_X2] - mem[H.STAT_X] * mem[H.STAT_X] / mem[H.STAT_N];

	/*
	// already checked in "statkr error 2" and "statkr error 3"
	if (rr2 === 0 || rr3 === 0) {
		console.log("statkr error 5");
		return [0];
	}
	*/

	if ((rr2 * rr3) < 0) {
		// console.log("statkr error 6");
		return [0];
	}

	var rr = Math.sqrt(rr2 * rr3);

	var r = rr1 / rr;

	var c;

	if (is_x) {
		if (H.feq10_0(B, 0)) {
			// console.log("statkr error 7");
			return [0];
		}
		c = (xx - A) / B;
	} else {
		c = A + B * xx;
	}

	c = H.solve_infinity(c) || 0;
	r = H.solve_infinity(r) || 0;

	return [1, c, r];
};

H.stat_accumulate = function (sgn, mem, x, y)
{
	mem[H.STAT_N] += sgn;
	mem[H.STAT_X] += sgn * x;
	mem[H.STAT_X2] += sgn * x * x;
	mem[H.STAT_Y] += sgn * y;
	mem[H.STAT_Y2] += sgn * y * y;
	mem[H.STAT_XY] += sgn * x * y;
};

H.stat_avg = function (mem)
{
	if (mem[H.STAT_N] === 0) {
		return [0];
	}
	var x = mem[H.STAT_X] / mem[H.STAT_N];
	var y = mem[H.STAT_Y] / mem[H.STAT_N];
	return [1, x, y];
};

H.stat_avgw = function (mem)
{
	if (mem[H.STAT_X] === 0) {
		return [0];
	}
	return [1, mem[H.STAT_XY] / mem[H.STAT_X]];
};

// MODIFIED VERSION OF: https://github.com/cslarsen/mersenne-twister

/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.

  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:

  var m = new MersenneTwister(123);

  and that will always produce the same random sequence.

  Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

/*jslint bitwise: false */

H.Prng = function (seed)
{
	var self = {};

	seed = seed || 0;

	// convert to 0 <= x < 1 range
	seed = Math.abs(seed);
	while (seed >= 1) {
		seed /= 10;
	}

	// save for further RCL
	self.seed = seed;

	// condition to needs of this particular prng: 32-bit integer, non-zero
	if (seed === 0) {
		seed = 1;
	}
	while (seed < 0x40000000) {
		seed *= 1.9123456789;
	}

	/* Period parameters */  
	self.N = 624;
	self.M = 397;
	self.MMA = 0x9908b0df;   /* constant vector a */
	self.UMA = 0x80000000; /* most significant w-r bits */
	self.LMA = 0x7fffffff; /* least significant r bits */
 
	self.mt = [];          /* the array for the state vector */
	self.mti = self.N + 1; /* mti==N+1 means mt[N] is not initialized */

	self.getSeed = function ()
	{
		return self.seed;
	};
 
	/* initializes mt[N] with a seed */
	self.private_init = function (seed)
	{
		self.mt[0] = seed >>> 0;
		for (self.mti = 1; self.mti < self.N; self.mti++) {
			var s = self.mt[self.mti - 1] ^ (self.mt[self.mti - 1] >>> 30);
			self.mt[self.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + 
				(s & 0x0000ffff) * 1812433253) + self.mti;
			/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
			/* In the previous versions, MSBs of the seed affect   */
			/* only MSBs of the array mt[].                        */
			/* 2002/01/09 modified by Makoto Matsumoto             */
			self.mt[self.mti] >>>= 0;
			/* for >32 bit machines */
		}
	};
 
	/* generates a random number on [0,0xffffffff]-interval */
	self.gen32 = function ()
	{
		var y;
		var mag01 = [0x0, self.MMA];
		/* mag01[x] = x * MMA  for x=0,1 */
	
		if (self.mti >= self.N) { /* generate N words at one time */
			var kk;
	
			for (kk = 0; kk < self.N - self.M; kk++) {
				y = (self.mt[kk] & self.UMA) | (self.mt[kk + 1] & self.LMA);
				self.mt[kk] = self.mt[kk + self.M] ^ (y >>> 1) ^ mag01[y & 0x1];
			}
	
			for (; kk < self.N - 1; kk++) {
				y = (self.mt[kk] & self.UMA) | (self.mt[kk + 1] & self.LMA);
				self.mt[kk] = self.mt[kk + (self.M - self.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
			}
	
			y = (self.mt[self.N - 1] & self.UMA) | (self.mt[0] & self.LMA);
			self.mt[self.N - 1] = self.mt[self.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
	
			self.mti = 0;
		}
	
		y = self.mt[self.mti++];
	
		/* Tempering */
		y ^= (y >>> 11);
		y ^= (y << 7) & 0x9d2c5680;
		y ^= (y << 15) & 0xefc60000;
		y ^= (y >>> 18);
	
		return y >>> 0;
	};
 	
	/* generates a random number on [0,1) with 53-bit resolution*/
	self.random = function ()
	{ 
		var a = self.gen32() >>> 5;
		var b = self.gen32() >>> 6; 
		return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0); 
	};

	self.private_init(seed);

	return self;
};

H.sin = function (r)
{
	r = r % (2 * Math.PI);
	var res = Math.sin(r);
	if (Math.abs(res) <= 2.5e-16) {
		res = 0;
	}	
	return res;
};

H.cos = function (r)
{
	r = r % (2 * Math.PI);
	var res = Math.cos(r);
	if (Math.abs(res) <= 2.5e-16) {
		res = 0;
	}	
	return res;
};

H.tan = function (r)
{
	r = r % Math.PI;
	var res = H.sin(r) / H.cos(r);
	if (res > H.value_max) {
		res = H.value_max;
	} else if (res < -H.value_max) {
		res = -H.value_max;
	}
	return res;
};
/* HP-12C emulator 
				ionsole.log("----------------------------");
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

H.COMPLEX_i = {r: 0, i: 1, h: 0};
H.COMPLEX_2i = {r: 0, i: 2, h: 0};
H.COMPLEX_i_NEG = {r: 0, i: -1, h: 0};
H.COMPLEX_ONE = {r: 1, i: 0, h: 0};
H.COMPLEX_TEN = {r: 10, i: 0, h: 0};
H.COMPLEX_HALF = {r: 0.5, i: 0, h: 0};
H.COMPLEX_ONE_NEG = {r: -1, i: 0, h: 0};

H.complex_plus = function (y, x)
{
	var real = y.r + x.r;
	var imag = y.i + x.i;
	return {r: real, i: imag, h: 0};
};

H.complex_minus = function (y, x)
{
	var real = y.r - x.r;
	var imag = y.i - x.i;
	return {r: real, i: imag, h: 0};
};

H.complex_multiply = function (y, x)
{
	var real = y.r * x.r - y.i * x.i;
	var imag = y.r * x.i + y.i * x.r;
	return {r: real, i: imag, h: 0};
};

H.complex_divide = function (y, x)
{
	var real = y.r * x.r + y.i * x.i;
	var imag = y.i * x.r - y.r * x.i;
	var div = x.r * x.r + x.i * x.i;
	real = real / div;
	imag = imag / div;
	var error = isNaN(imag) || isNaN(real) || (! isFinite(imag)) || (! isFinite(real));

	return {r: real, i: imag, h: 0, err: error};
};

H.complex_square = function (y)
{
	return H.complex_multiply(y, y);
};

H.complex_power = function (a, b)
{
	var polar = H.complex_to_polar(a);
	var a_len = polar.r;
	var a_angle = polar.i;

	if (a_len === 0) {
		// avoids a failure mode, and 0^z=0
		if (b.r !== 0 || b.i !== 0) {
			return {r: 0, i: 0, h: 0, err: 0};
		} else {
			return {r: 0, i: 0, h: 0, err: 1};
		}
	}

	var power = {r: Math.log(a_len), i: a_angle, h: 0};
	power = H.complex_multiply(power, b);

	var res = H.complex_exp(power);
	res.err = 0;
	return res;
};

H.complex_ln = function (arg)
{
	var polar = H.complex_to_polar(arg);
	var a_len = polar.r;
	var a_angle = polar.i;

	if (a_len === 0) {
		// avoids a failure mode, and 0^z=0
		return {r: 0, i: 0, h: 0, err: true};
	}

	return {r: Math.log(a_len), i: a_angle, h: 0, err: false};
};

H.complex_log10 = function (y)
{
	var lnat = H.complex_ln(y);

	if (lnat.err) {
		return lnat;
	}

	// log_a(b) = ln(b)/ln(a)
	return H.complex_divide(lnat, {r: Math.log(10), i: 0, h: 0});
};

H.complex_sqrt = function (y)
{
	// can't fail because 0^0 can't occur
	return H.complex_power(y, H.COMPLEX_HALF);
};

H.complex_reciprocal = function (y)
{
	return H.complex_divide(H.COMPLEX_ONE, y);
};

H.complex_exp = function (y)
{
	var e = Math.exp(y.r);
	var real = e * H.clamp(H.cos(y.i));
	var imag = e * H.clamp(H.sin(y.i));
	return {r: real, i: imag, h: 0};
};

H.complex_power10 = function (y)
{
	// can't fail because the single impossible
	// complex power is 0^0
	return H.complex_power(H.COMPLEX_TEN, y);
};

H.complex_abs = function (y)
{
	var real = Math.sqrt(y.r * y.r + y.i * y.i);
	return {r: real, i: 0, h: 0};
};

H.complex_to_polar = function (arg)
{
	var len = H.complex_abs(arg).r;
	var angle = Math.atan2(arg.i, arg.r); // always returns a valid number
	return {r: len, i: angle, h: 0};
};

H.complex_to_cartesian = function (arg)
{
	var x = arg.r * H.cos(arg.i);
	var y = arg.r * H.sin(arg.i);
	return {r: x, i: y, h: 0};
};

H.complex_sin = function (y)
{
	var real = H.sin(y.r) * H.cosh(y.i);
	var imag = H.cos(y.r) * H.sinh(y.i);
	return {r: real, i: imag, h: 0};
};

H.complex_cos = function (y)
{
	var real = + H.cos(y.r) * H.cosh(y.i);
	var imag = - H.sin(y.r) * H.sinh(y.i);
	return {r: real, i: imag, h: 0};
};

H.complex_tan = function (y)
{
	return H.complex_divide(H.complex_sin(y), H.complex_cos(y));
};

H.complex_asin = function (y)
{
	// arcsin(z) = 1/i * ln(iz + sqrt(1 - z^2)); 1/i = -i
	var res1 = H.complex_multiply(H.COMPLEX_i, y);
	var res2 = H.complex_multiply(y, y);
	res2 = H.complex_minus(H.COMPLEX_ONE, res2);
	res2 = H.complex_sqrt(res2);
	var res = H.complex_plus(res1, res2);
	res = H.complex_ln(res);

	if (! res.err) {
		var inv = H.complex_reciprocal(H.COMPLEX_i);
		res = H.complex_multiply(inv, res);
	}

	return res;
};

H.complex_acos = function (y)
{
	// arccos(z) = 1/i * ln(z + i.sqrt(1 - z^2)); 1/i=-i
	var res2 = H.complex_multiply(y, y);
	res2 = H.complex_minus(H.COMPLEX_ONE, res2);
	res2 = H.complex_sqrt(res2);
	res2 = H.complex_multiply(H.COMPLEX_i, res2);
	var res = H.complex_plus(y, res2);
	res = H.complex_ln(res);

	if (! res.err) {
		var inv = H.complex_reciprocal(H.COMPLEX_i);
		res = H.complex_multiply(inv, res);
	}

	return res;
};

H.complex_atan = function (y)
{
	// arctan(z) = 1/2i * ln((1 + iz) / (1 - iz))
	var res1 = H.complex_multiply(H.COMPLEX_i, y);
	res1 = H.complex_plus(H.COMPLEX_ONE, res1);
	var res2 = H.complex_multiply(H.COMPLEX_i, y);
	res2 = H.complex_minus(H.COMPLEX_ONE, res2);
	var res = H.complex_divide(res1, res2);
	if (res.err) {
		return res;
	}

	res = H.complex_ln(res);

	if (res.err) {
		return res;
	}

	var inv = H.complex_reciprocal(H.COMPLEX_2i);
	res = H.complex_multiply(inv, res);

	return res;
};

H.complex_sinh = function (y)
{
	// sinh x = -i sin ix
	var arg = H.complex_multiply(y, H.COMPLEX_i);
	var res = H.complex_sin(arg);
	res = H.complex_multiply(res, H.COMPLEX_i_NEG);
	return res;
};

H.complex_cosh = function (y)
{
	// cosh x = cos ix
	var arg = H.complex_multiply(y, H.COMPLEX_i);
	return H.complex_cos(arg);
};

H.complex_tanh = function (y)
{
	// tanh x = -i tan ix
	var arg = H.complex_multiply(y, H.COMPLEX_i);
	var res = H.complex_tan(arg);
	if (res.err) {
		return res;
	}
	res = H.complex_multiply(res, H.COMPLEX_i_NEG);
	return res;
};

H.complex_asinh = function (y)
{
	// arcsinh(z) = ln(z + sqrt(z^2 + 1))
	var res = H.complex_multiply(y, y);
	res = H.complex_plus(res, H.COMPLEX_ONE);
	res = H.complex_sqrt(res);
	res = H.complex_plus(res, y);
	res = H.complex_ln(res);
	return res;
};

H.complex_acosh = function (z)
{
	// arccosh(z) = ln(z + sqrt(z + 1) * sqrt(z - 1))
	var res1 = H.complex_plus(z, H.COMPLEX_ONE);
	var res2 = H.complex_minus(z, H.COMPLEX_ONE);
	res1 = H.complex_sqrt(res1);
	res2 = H.complex_sqrt(res2);
	var res = H.complex_multiply(res1, res2);
	res = H.complex_plus(res, z);
	res = H.complex_ln(res);
	return res;
};

H.complex_atanh = function (y)
{
	// arctanh(z) = 0.5 * ln((1 + z) / (1 - z))
	var res1 = H.complex_plus(H.COMPLEX_ONE, y);
	var res2 = H.complex_minus(H.COMPLEX_ONE, y);
	var res = H.complex_divide(res1, res2);
	if (res.err) {
		return res;
	}

	res = H.complex_ln(res);

	if (res.err) {
		return res;
	}

	res = H.complex_multiply(res, H.COMPLEX_HALF);

	return res;
};

H.find_root = function (guess0, guess1)
{
	var guess = [guess1, guess0];
	var result = [null, null];

	if (H.feq10_0(guess[0], guess[1])) {
		// same estimates
		if (H.feq10(guess[0], 0)) {
			// estimates are zero
			guess[1] = 1;
		} else {
			// estimates are equal but nonzero
			guess[1] = guess[0] * 1.1;
		}
	}

	var self = {};

	var find_brent_range, secant_method, mullers_method;

	var phase = 0;
	var brent = null;

	var stow_estimation = function (pguess, presult) {
		guess.unshift(pguess);
		result.unshift(presult);
	};

	self.iterate = function (informed_result)
	{
		if (phase === 0) {
			phase = 10;
			brent = null;
			return [1, guess[1]];

		} else if (phase === 10) {
			phase = 15;
			result[1] = informed_result;
			return [2, null];

		} else if (phase === 15) {
			phase = 20;
			return [1, guess[0]];

		} else if (phase === 20) {
			phase = 30;
			result[0] = informed_result;

			if (! brent) {
				brent = H.brent_root(guess[0], guess[1], result[0], result[1],
							stow_estimation);
				
				if (! brent) {
					// guess0..guess1 range does not contain a root

					if (! find_brent_range()) {
						// could not interpolate to find a range
						return [4, null];
					}

					brent = null;
					phase = 15;

					// back to phase 15, yield with no calculation request
					return [2, null];
				}
			}

			var bres = brent.iterate0();

			if (bres === 0) {
				// found root
				return [0, brent.root()];
			}

			if (bres === 1) {
				// Brent cycle, need value of f(x)
				return [1, brent.get_x()];
			}

			// error in Brent algorithm; quit
			return [5, null];

		} else if (phase === 30) {
			phase = 20;
			brent.iterate1(informed_result);

			// back to phase 20 (another cycle of Brent algorithm)
			return [2, null];
		}
	};

	var rounds = 0;
	var range_method = 1;

	find_brent_range = function ()
	{
		var ret = true;
		++rounds;

		if (range_method === 1) {
			if (rounds > 25 || ! secant_method()) {
				++range_method;
				console.log("Root solve: Moving to parabolic");
			}
		}

		if (range_method === 2) {
			rounds = 0;
			++range_method;
			// throw away all but the original estimates
			guess.splice(0, guess.length - 2);
			result.splice(0, result.length - 2);
		}
			
		if (range_method === 3) {
			if (rounds > 15) {
				ret = false;
			} else {
				ret = mullers_method();
			}
		}

		if (ret) {
			console.log("Root solve: new estimates " + guess[0] + ", " + guess[1] + ", " +
					guess[2]);
		}

		return ret;
	};

	// Based on http://dafeda.wordpress.com/2010/09/09/mullers-method-deriving-of-and-code/
	// DaFeda's Blog
	mullers_method = function ()
	{
		if (guess.length < 3) {
			// need a third estimate to calculate parabola
			var estimate;
			/*
			if (wild) {
				estimate = guess[0] - 2 * (guess[1] - guess[0]);
			*/
			estimate = (guess[0] + guess[1]) / 2;
			stow_estimation(estimate, null);
			return true;
		}

		var x0 = guess[0];
		var x1 = guess[1];
		var x2 = guess[2];
		var f0 = result[0];
		var f1 = result[1];
		var f2 = result[2];

		var h1 = x1 - x0;
		var h2 = x0 - x2;
		var ga = h2 / h1;

		// parabola in form a(x - x0)^2 + b(x - x0) + c
		var c = f0;
		var a = (ga * f1 - f0 * (1 + ga) + f2) / (ga * h1 * h1 * (1 + ga));
		var b = (f1 - f0 - a * h1 * h1) / h1;

		var discrim = b * b - 4 * a * c;
		if (discrim < 0) {
			// no apparent roots but try to find the bottom
			// of the parabola
			discrim = 0;
		}

		var root11 = x0 - ((2 * c) / (b + discrim));
		var root22 = x0 - ((2 * c) / (b - discrim));

		// by default, new guess is exactly at top-most or
		// bottom-most point of parabola, in hope of bracketing
		// the root (the actual curve may not be actually a
		// parabola)

		var new_guess = (root11 + root22) / 2;

		var root1 = Math.min(root11, root22);
		var root2 = Math.max(root11, root22);

		if (guess[0] >= root1 && guess[0] <= root2) {
			// current guess is between roots, put new guess outside
			// this range in order to bracket the root and leave Brent
			// to do its work
			if (rounds % 2) {
				new_guess = root2 + Math.abs(root2) * 0.1 + 1;
			} else {
				new_guess = root1 - Math.abs(root1) * 0.1 - 1;
			}
		}
		
		if (new_guess > H.value_max || new_guess < -H.value_max) {
			console.log("Root solve: Mueller: Overflow");
			return false;
		}

		stow_estimation(new_guess, null);

		return true;
	};

	secant_method = function ()
	{
		if (H.feq10_0(guess[0], guess[1]) || H.feq10_0(result[0], result[1])) {
			console.log("secant: guesses or results too nearby");
			return false;
		}

		var A = (result[1] - result[0]) / (guess[1] - guess[0]);
		var B = result[0] - A * guess[0];

		// try to find a guess that yields something around -result
		var base_result = -result[0];
		var new_guess = (base_result - B) / A;

		if (Math.abs(A) < Math.pow(10, -7)) {
			// choose a farther point, the curve seems to
			// be almost level or asymptotic
			new_guess *= 100;
			console.log("Root solve: Boosting guess due to low A");
		} else if (result.length > 3 &&
				(guess[0] * guess[1] > 0) &&
				(guess[1] * guess[2] > 0) &&
				(guess[2] * guess[3] > 0)) {
			// possible exponential curve, estimates are
			// in right direction but converging too slowly
			// Solution: double the pace
			new_guess += 2 * (guess[0] - guess[1]);
			console.log("Root solve: Boosting guess due to exp() behavior");
		}

		if (new_guess > H.value_max || new_guess < -H.value_max) {
			console.log("Root solve: Secant: Overflow");
			return false;
		}

		stow_estimation(new_guess, null);

		return true;
	};

	self.last_estim = function () {
		return guess[0];
	};

	self.second_last_estim = function () {
		return guess[1];
	};

	self.last_fx = function () {
		return result[0] || 0;
	};

	return self;
};

// Adapted from Wikipedia article "Brent's Method"
// if returns null, f(guess0) has the same sign as f(guess1)
// if not, client is expected to call o.iterate0(), and
// o.iterate1(function(o.get_x()).
// o.iterate0() returns: 0 if done -> o.root() returns root
//			 1 if not complete yet
//                       2 if error (did not find a root)

H.brent_root = function (guess0, guess1, result0, result1, stow)
{
	var a = guess0;
	var b = guess1;
	var c = 0;
	var d = H.value_max;

	var fa = result0;
	var fb = result1;

	// if f(a) f(b) > 0 then error-exit
	if (fa * fb > 0) {
		return null;
	}

	var fc = 0;
	var s = 0;

	var self = {};

	self.root = function () {
		return b;
	};

	var mflag = true;

	// if |f(a)| < |f(b)| then swap (a,b) end if
	if (Math.abs(fa) < Math.abs(fb)) {
		var tmp;
		tmp = a;
		a = b;
		b = tmp;
		tmp = fa;
		fa = fb;
		fb = tmp;
	}

	c = a;
	fc = fa;

	var i = 0;

	self.iterate0 = function () {
		if (H.feq10_0(fb, 0)) {
			// done
			return 0;
		}

		if (H.feq10(a, b) || (++i > 50)) {
			// a == b but zero not found, or too many cycles
			return 2;
		}

		if (! H.feq10_0(fa, fc) && ! H.feq10_0(fb, fc)) {
			// Inverse quadratic interpolation
			s = a * fb * fc / (fa - fb) / (fa - fc) + b * fa * fc / (fb - fa) / (fb - fc) +
				c * fa * fb / (fc - fa) / (fc - fb);
		} else {
			// Secant Rule
			s = b - fb * (b - a) / (fb - fa);
		}

		var tmp2 = (3 * a + b) / 4;

		if ((!(((s > tmp2) && (s < b)) || ((s < tmp2) && (s > b)))) ||
				(mflag && (Math.abs(s - b) >= (Math.abs(b - c) / 2))) ||
				(!mflag && (Math.abs(s - b) >= (Math.abs(c - d) / 2)))) {
			s = (a + b) / 2;
			mflag = true;
		} else {
			if ((mflag && H.feq10_0(b, c)) ||
					(!mflag && H.feq10_0(c, d))) {
				s = (a + b) / 2;
				mflag = true;
			} else {
				mflag = false;
			}
		}

		return 1;
	};

	self.get_x = function () {
		return s;
	};

	// fs = function(s);

	self.iterate1 = function (fs)
	{
		if (stow) {
			// communicate the new pair guess/result to client
			stow(s, fs);
		}

		d = c;
		c = b;
		fc = fb;
		if (fa * fs < 0) {
			b = s;
			fb = fs;
		} else {
			a = s;
			fa = fs;
		}

		// if |f(a)| < |f(b)| then swap (a,b) end if
		if (Math.abs(fa) < Math.abs(fb)) {
			var tmp;
			tmp = a;
			a = b;
			b = tmp;
			tmp = fa;
			fa = fb;
			fb = tmp;
		}
	};

	return self;
};


// Adaptive Simpson's Rule, adapted from Wikipedia
H.adaptive_simpson = function (a, b, decimals)
{
	var fa, fb, fc;

	var self = {};

	var cf = null; // current execution frame
	var pre_phase = 0;

	var depth = 12; // max. 4096 samples taken
	var moderation = 0.34; // precision redution for inner depths

	self.depth_warning = false;

	var make_frame = function (frcaller, fra, frb, frepsilon, frS, frfa, frfb, frfc,
					frdepth, frbranch)
	{
		var frame_name = "";
		if (frcaller) {
			frame_name = frcaller.name + " ";
		}
		frame_name += "" + frdepth + ":" + frbranch;

		var frame = {
			caller: frcaller,
			a: fra,
			b: frb,
			epsilon: frepsilon,
			S: frS,
			fa: frfa,
			fb: frfb,
			fc: frfc,
			depth: frdepth,
			phase: 10,
			branch: frbranch,
			name: frame_name
		};

		// console.log("Simpson: new frame " + frame_name);

		return frame;
	};

	self.iterate = function (res)
	{
		if (cf === null) {
			if (pre_phase === 0) {
				if (H.feq10(a, b)) {
					return [0, 0, 0];
				}

				pre_phase = 1;
				return [1, a];
			} else if (pre_phase === 1) {
				pre_phase = 2;
				fa = res;
				return [1, b];
			} else if (pre_phase === 2) {
				pre_phase = 3;
				fb = res;
				var c = (a + b) / 2;
				return [1, c];
			} else if (pre_phase === 3) {
				pre_phase = 4;
				fc = res;
				var tmp_h = b - a;
				var tmp_S = (tmp_h / 6) * (fa + 4 * fc + fb);
				cf = make_frame(null, a, b, decimals + 1, tmp_S, fa, fb, fc, depth, 0);
				return [2];
			}
		} else if (cf.phase === 10) {
			cf.phase = 11;
			cf.c = (cf.a + cf.b) / 2;
			cf.h = cf.b - cf.a;
			cf.d = (cf.a + cf.c) / 2;
			cf.e = (cf.c + cf.b) / 2;
			// ask the client to calculate one point
			return [1, cf.d];

		} else if (cf.phase === 11) {
			cf.phase = 12;
			cf.fd = res;
			// ask the client to calculate one more point
			return [1, cf.e];

		} else if (cf.phase === 12) {
			cf.phase = 13;
			cf.fe = res;
			cf.Sleft = (cf.h / 12) * (cf.fa + 4 * cf.fd + cf.fc);
			cf.Sright = (cf.h / 12) * (cf.fc + 4 * cf.fe + cf.fb);
			cf.S2 = cf.Sleft + cf.Sright;

			if (cf.depth <= 0 && ! self.depth_warning) {
				console.log("Integration: Maximum depth reached");
				self.depth_warning = true;
			}

			if (cf.depth <= 0 || H.feq_digits(cf.S2, cf.S,
							Math.max(1, cf.epsilon + 1),
							15 * 0.9)) {
				cf.result = cf.S2 + (cf.S2 - cf.S) / 15;
				cf.error_est = Math.abs(cf.S2 - cf.S) / 15;

				if (cf.caller) {
					cf.caller.callee_result[cf.branch] = cf.result;
					cf.caller.callee_error_est[cf.branch] = cf.error_est;
					// give back control to caller
					cf = cf.caller;
					// ask the client to proceed with iteration
					return [2];
				}

				// top-level frame created by self.begin()
				// return result to client
				return [0, cf.result, cf.error_est];
			}

			// prepare to recurse
			cf.callee_result = [0, 0];
			cf.callee_error_est = [0, 0];

			// create new stack frame of recursion, branch 0
			cf = make_frame(cf, cf.a, cf.c, cf.epsilon - moderation, cf.Sleft, cf.fa, cf.fc, cf.fd,
					cf.depth - 1, 0);
			// ask the client to proceed with iteration
			return [2];

		} else if (cf.phase === 13) {
			cf.phase = 14;
			// create new stack frame of recursion, branch 1
			cf = make_frame(cf, cf.c, cf.b, cf.epsilon - moderation, cf.Sright, cf.fc, cf.fb, cf.fe,
					cf.depth - 1, 1);
			// ask the client to proceed with iteration
			return [2];

		} else if (cf.phase === 14) {
			// both interactively called functions returned their results
			cf.result = cf.callee_result[0] + cf.callee_result[1];
			cf.error_est = cf.callee_error_est[0] + cf.callee_error_est[1];

			if (cf.caller) {
				cf.caller.callee_result[cf.branch] = cf.result;
				cf.caller.callee_error_est[cf.branch] = cf.error_est;
				// give back control to caller
				cf = cf.caller;
				// ask the client to proceed with iteration
				return [2];
			}

			// top-level frame created by self.begin()
			// return result to client
			return [0, cf.result, cf.error_est];
		}
	};

	return self;
};

H.matrix = function (test)
{
	var self = { };

	self.contents = {};
	self.nrows = 0;
	self.ncolumns = 0;

	self.is_matrix = true;

	self.cols = function () {
		return self.ncolumns;
	};

	self.rows = function () {
		return self.nrows;
	};

	self.dim = function (rows, columns) {
		self.nrows = rows;
		self.ncolumns = columns;

		return self;
	};

	var coord = function (row, col) {
		var l = "s0";
		if (row < 0 || row >= self.nrows || col < 0 || col >= self.ncolumns) {
			H.error("Out of bounds");
		} else {
			l = col + row * self.ncolumns;
		}
		return "s" + l;
	};

	self.get = function (row, col) {
		var c = coord(row, col);
		if (! (c in self.contents)) {
			self.contents[c] = 0;
		}
		return self.contents[c];
	};

	self.set = function (row, col, value) {
		var c = coord(row, col);
		self.contents[c] = value;

		return self;
	};

	self.walk = function (f) {
		for (var y = 0; y < self.nrows; ++y) {
			for (var x = 0; x < self.ncolumns; ++x) {
				var ret = f(y, x, self.get(y, x));
				if (ret !== null && ret !== undefined) {
					self.set(y, x, ret);
				}
			}
		}

		return self;
	};

	self.zero = function () {
		self.walk(function (row, col) {
			return 0;
		});

		return self;
	};

	self.copy = function () {
		var na = H.matrix();
		na.dim(self.nrows, self.ncolumns);
		na.walk(function (row, col) {
			return self.get(row, col);
		});
		return na;
	};

	self.is_square = function () {
		return self.nrows === self.ncolumns;
	};

	self.same_dim = function (a) {
		return a.cols() === self.ncolumns && a.rows() === self.nrows;
	};

	self.scalar_sum = function (n) {
		var c = self.copy();
		c.walk(function (r, c, val) {
			return val + n;
		});
		return c;
	};

	self.scalar_multiply = function (n) {
		var c = self.copy();
		c.walk(function (r, c, val) {
			return val * n;
		});
		return c;
	};

	self.multiply = function (b) {
		if (self.cols() !== b.rows()) {
			// console.log("matrix multiply: non-aligned");
			return null;
		}

		var diff = self.cols();
		var res = H.matrix();
		res.dim(self.rows(), b.cols());

		res.walk(function (r, c) {
			var tot = 0;
			for (var x = 0; x < diff; ++x) {
				tot += self.get(r, x) * b.get(x, c);
			}
			return tot;
		});

		return res;
	};

	self.multiplytransposed = function (b) {
		return H.matrix_multiply(self.transpose(), b);
	};

	self.divide_by = function (b) {
		// A/B = inv(B).A
		b = b.inverse();
		if (b === null) {
			// console.log("matrix divide: arg non invertible");
			return null;
		}
		return b[0].multiply(self);
	};

	self.chs = function () {
		var c = self.copy();
		c.walk(function (r, c, val) {
			return -val;
		});
		return c;
	};

	self.transpose = function () {
		var c = H.matrix();
		c.dim(self.ncolumns, self.nrows); // note the inversion
		c.walk(function (r, c, val) {
			return self.get(c, r);
		});
		return c;
	};

	var triangular_determinant = function (m) {
		var res = 1;
		for (var x = 0; x < m.rows(); ++x) {
			res *= m.get(x, x);
		}
		return res;
	};

	self.determinant = function () {
		if (! self.is_square()) {
			return null;
		}

		if (self.rows() <= 0) {
			return 0;
		}

		var decomp = self.ludecomposition();
		var L = decomp[0];
		var U = decomp[1];
		// var P = decomp[2];
		var exchanges = decomp[3];
		var tweaked = decomp[4];

		return ((exchanges % 2 === 0) ? 1 : -1) *
			triangular_determinant(L) *
			triangular_determinant(U);
	};

	self.rownorm = function () {
		var norm = 0;

		for (var r = 0; r < self.rows(); ++r) {
			var candidate = 0;
			for (var c = 0; c < self.cols(); ++c) {
				candidate += Math.abs(self.get(r, c));
			}
			norm = Math.max(norm, candidate);
		}

		return norm;
	};

	self.euclideannorm = function (a) {
		var norm = 0;

		for (var r = 0; r < self.rows(); ++r) {
			for (var c = 0; c < self.cols(); ++c) {
				norm += self.get(r, c) * self.get(r, c);
			}
		}

		return Math.sqrt(norm);
	};

	self.zc_zp = function () {
		if ((2 * self.rows()) !== self.cols()) {
			return null;
		}

		var zp = H.matrix();
		zp.dim(self.cols(), self.rows());
		self.walk(function (r, c, val) {
			var imag = (c % 2) ? self.rows() : 0;
			var tr = r + imag;
			var tc = Math.floor(c / 2);
			zp.set(tr, tc, val);
			return null;
		});
		return zp;
	};

	self.zp_zc = function (a) {
		if ((2 * self.cols()) !== self.rows()) {
			return null;
		}

		var zc = H.matrix();
		zc.dim(self.cols(), self.rows());
		self.walk(function (r, c, val) {
			var imag = (r >= self.cols() ? 1 : 0);
			var tr = r % self.cols();
			var tc = 2 * c + imag;
			zc.set(tr, tc, val);
			return null;
		});
		return zc;
	};

	self.ztilde_zp = function (a) {
		if (! self.is_square() || (self.cols() % 2)) {
			return null;
		}

		var zp = H.matrix();
		zp.dim(self.rows(), self.cols() / 2);

		zp.walk(function (r, c) {
			return self.get(r, c);
		});

		return zp;
	};

	self.zp_ztilde = function (a) {
		if ((2 * self.cols()) !== self.rows()) {
			return null;
		}

		var ztilde = H.matrix();
		ztilde.dim(self.rows(), self.cols() * 2);
		self.walk(function (r, c, val) {
			ztilde.set(r, c, self.get(r, c));
			if (r < self.cols()) {
				// copy x to lower right quadrant
				ztilde.set(r + self.cols(), c + self.cols(), self.get(r, c));
			} else {
				// copy -y to upper right quadrant
				ztilde.set(r - self.cols(), c + self.cols(), -self.get(r, c));
			}
			return null;
		});
		return ztilde;
	};

	var make_triang_invertible = function (m) {
		var tweaked = false;

		for (var x = 0; x < m.cols(); ++x) {
			var val = m.get(x, x);
			if (Math.abs(val) < H.value_min) {
				m.set(x, x, 0.0000000001);
				tweaked = true;
			}
		}

		return tweaked;
	};

	// Based on http://www.planet-source-code.com/vb/scripts/ShowCode.asp?txtCodeId=13618&lngWId=3
	// and https://github.com/cf16/examples/blob/master/cppapp_matrix_invertion_0/main.cpp
	var invert_blind = function (mt) {
		var a = mt.copy();
		var b = mt.identity();
		var dimension = a.rows();

		for (var j = 0; j < dimension; j++) {
			var temp = j;

        		/* finding maximum jth column element in last (dimension-j) rows */
			for (var i = j + 1; i < dimension; i++) {
				if (a.get(i, j) > a.get(temp, j)) {
					temp = i;
				}
			}

			/* swapping row which has maximum jth column element */
			if (temp !== j) {
				for (var k = 0; k < dimension; k++) {
					var swap = a.get(j, k);
					a.set(j, k, a.get(temp, k));
					a.set(temp, k, swap);
					swap = b.get(j, k);
					b.set(j, k, b.get(temp, k));
					b.set(temp, k, swap);
				}
			}

			/* performing row operations to form required identity matrix
			   out of the input matrix */

			for (i = 0; i < dimension; i++) {
				var r = a.get(i, j);
				var s = a.get(j, j);
				if (i !== j) {
					for (k = 0; k < dimension; k++) {
						a.set(i, k, a.get(i, k) - a.get(j, k) * r / s);
						b.set(i, k, b.get(i, k) - b.get(j, k) * r / s);
					}
				} else {
					for (k = 0; k < dimension; k++) {
						a.set(i, k, a.get(i, k) / r);
						b.set(i, k, b.get(i, k) / r);
					}
				}
			}
		}

		return b;
	};

	self.inverse = function (a) {
		if (! self.is_square()) {
			return null;
		}

		var decomp = self.ludecomposition();
		var L = decomp[0];
		var U = decomp[1];
		var P = decomp[2];
		var exchanges = decomp[3];
		var tweaked = decomp[4];

		// PA=LU -> A^ = U^.L^.P

		var tweaked2 = make_triang_invertible(U);
		tweaked2 = tweaked2 || make_triang_invertible(L);

		var Ui = invert_blind(U);
		var Li = invert_blind(L);
		
		return [Ui.multiply(Li).multiply(P), tweaked, tweaked2];
	};

	self.identity = function ()
	{
		if (! self.is_square()) {
			return null;
		}

		var res = H.matrix();
		res.dim(self.rows(), self.cols());
		res.walk(function (i, j) {
			return (i === j ? 1 : 0);
		});

		return res;
	};

	self.swap_rows = function (x, y)
	{
		var c = self.copy();
		var i;

		for (i = 0; i < self.cols(); ++i) {
			self.set(x, i, c.get(y, i));
			self.set(y, i, c.get(x, i));
		}

		return self;
	};

	// based on http://rosettacode.org/wiki/LU_decomposition#Python
	// Make the biggest element of every column to fall in the diagonal of PA
	self.pivotize = function () {
		var exchanges = 0;
		var n = self.rows();
		var ID = self.identity();
		for (var j = 0; j < n; ++j) {
			var row = j;
			var val = 0;
        		// row = max(xrange(j, n), key=lambda i: abs(m[i][j]))
			for (var i = j; i < n; ++i) {
				var cand = Math.abs(self.get(i, j));
				if (val < cand) {
					val = cand;
					row = i;
				}
			}
			if (j !== row) {
				++exchanges;
				ID.swap_rows(j, row);
			}
		}

		return [ID, exchanges];
	};

	// based on http://rosettacode.org/wiki/LU_decomposition#Python,
	// with fixes for singular matrixes
	self.ludecomposition = function () {
		if (! self.is_square()) {
			// non-square
			return null;
		}

		var n = self.rows();
		// fixed original routine, L and U begin with identities
		var L = self.identity();
		var U = self.identity();
		var exchanges = 0;
		var tweaked = false;

		var P = self.pivotize();
		exchanges = P[1];
		P = P[0];
		var A2 = P.multiply(self);

		for (var j = 0; j < n; ++j) {
			var i, k;
			for (i = 0; i < (j + 1); ++i) {
            			// s1 = sum(U[k][j] * L[i][k] for k in xrange(i))
            			// U[i][j] = A2[i][j] - s1
				var s1 = 0;
				for (k = 0; k < i; ++k) {
					s1 += U.get(k, j) * L.get(i, k);
				}
				U.set(i, j, A2.get(i, j) - s1);
			}
			// fixed original routine, begins in j + 1
			for (i = j + 1; i < n; ++i) {
            			// s2 = sum(U[k][j] * L[i][k] for k in xrange(j))
            			// L[i][j] = (A2[i][j] - s2) / U[j][j]
				var s2 = 0;
				for (k = 0; k < j; ++k) {
					s2 += U.get(k, j) * L.get(i, k);
				}

				var dividend = A2.get(i, j) - s2;
				var divisor = U.get(j, j);
				var res = dividend / divisor;
				var res_tw = res;

				if ((res !== res) || (Math.abs(res) > H.value_max)) {
					// NaN indetermination (0/0), or overflow (that should not happen)
					res_tw = 0.25 * (res < 0 ? -1 : +1);
					tweaked = (res === res); // true if overflow, false if NaN
				}

				L.set(i, j, res_tw);
			}
		}
 
		return [L, U, P, exchanges, tweaked];
	};

	self.print = function () {
		var text = "\n=======================\n";
		for (var r = 0; r < self.rows(); ++r) {
			var srow = "";
			for (var c = 0; c < self.cols(); ++c) {
				var scol = "" + self.get(r, c);
				while (scol.length < 20) {
					scol += " ";
				}
				srow += scol;
				srow += " ";
			}
			text += srow;
			text += "\n";
		}
		text += "=======================\n";

		return text;
	};

	if (test) {
		var l = test.length;
		var c = 0;
		if (l > 0) {
			c = test[0].length;
		}
		self.dim(l, c);
		self.walk(function (r, c) {
			return test[r][c];
		});
	}

	return self;
};

H.is_matrix = function (candidate) {
	if (candidate && ((typeof candidate) === "object")) {
		if ("is_matrix" in candidate) {
			if (candidate.is_matrix === true) {
				return true;
			}
		}
	}
	return false;
};

H.matrix_sum = function (a, b) {
	// scalar and matrix
	if (! H.is_matrix(a)) {
		// scalar
		return b.scalar_sum(a);
	} else if (! H.is_matrix(b)) {
		// scalar
		return a.scalar_sum(b);
	}

	var a2 = a.copy();

	if (! a.same_dim(b)) {
		return null;
	}

	a2.walk(function (r, c, val) {
		return val + b.get(r, c);
	});

	return a2;
};

H.matrix_subtract = function (a, b) {
	// scalar and matrix
	if (! H.is_matrix(a)) {
		// scalar
		return b.chs().scalar_sum(a);
	} else if (! H.is_matrix(b)) {
		// scalar
		return a.scalar_sum(-b);
	}

	if (! a.same_dim(b)) {
		return null;
	}

	var a2 = a.copy();

	a2.walk(function (r, c, val) {
		return val - b.get(r, c);
	});

	return a2;
};

H.matrix_multiply = function (a, b) {
	// scalar and matrix
	if (! H.is_matrix(a)) {
		// scalar
		return b.scalar_multiply(a);
	} else if (! H.is_matrix(b)) {
		// scalar
		return a.scalar_multiply(b);
	}

	return a.multiply(b);
};

H.matrix_divide = function (a, b) {
	// scalar and matrix
	if (! H.is_matrix(a)) {
		// scalar / matrix = scalar * matrix^-1
		b = b.inverse();
		if (b === null) {
			// not invertible
			return null;
		}
		return b[0].scalar_multiply(a);
	} else if (! H.is_matrix(b)) {
		// matrix / scalar = matrix * scalar^-1
		if (b === 0) {
			return null;
		}
		return a.scalar_multiply(1 / b);
	}

	return a.divide_by(b);
};

H.matrix_residual = function (b, a, x) {
	// AX=B, B-AX~=0
	if (! H.is_matrix(a) || ! H.is_matrix(x) || ! H.is_matrix(b)) {
		return null;
	}
	var ax = a.multiply(x);
	if (ax !== null) {
		ax = H.matrix_subtract(b, ax);
	}
	return ax;
};

H.matrix_from_mem = function (ma, sa)
{
	var m = H.matrix();
	m.dim(sa[0], sa[1]);
	m.walk(function (r, c) {
		return ma[r * sa[1] + c];
	});
	return m;
};

H.matrix_to_mem = function (m)
{
	var ma = [];
	var sa = [m.rows(), m.cols()];
	m.walk(function (r, c, val) {
		ma.push(val);
	});
	return [ma, sa];
};
H.sve = 30.5;
H.kve = "bedebc53ca7d3f29c4872712a5a316f8";
H.kve2 = "6a49f4df7b7d90df5ec23b9585d9b6b779b80005";
/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */

/*global H */

"use strict";

function Hp12c_pgrm()
{
	this.constructor();
}

Hp12c_pgrm.prototype.constructor = function ()
{
	this.exec_special = [];
	this.exec_special[H.GTO] = [2, 1, this.p_exec_gto];
	this.exec_special[H.GSB] = [2, 1, this.p_exec_gosub];
	if (H.type === "15c") {
		// 15C: see remark [1]
		this.exec_special[H.GTO_DOT] = [3, 1, this.p_exec_gto_dot];
		this.exec_special[H.GSB_DOT] = [3, 1, this.p_exec_gosub_dot];
	}

	this.exec_special[H.GG * 100 + H.GSB] = [2, 0, this.p_exec_rtn];
	this.exec_special[H.dispatcher.KEY_RS] = [1, 0, this.p_exec_rs];

	this.label_count = 0;

	this.type_special = [];
	var t = this.type_special;

	t[H.GG * 100 + H.dispatcher.KEY_RS] = this.p_type_pr;
	t[H.dispatcher.KEY_SST] = this.p_type_sst;
	t[H.GG * 100 + H.dispatcher.KEY_SST] = this.p_type_bst;
	t[H.dispatcher.KEY_BACKSPACE] = this.p_type_del;
	t[H.FF * 100 + H.dispatcher.KEY_RDOWN] = this.p_type_clear_pgrm;
	if (H.type === "15c") {
		t[H.GTO * 100 + H.dispatcher.KEY_CHS] = this.p_type_gto_move_begin;
	} else {
		t[H.GTO * 100 + H.dispatcher.KEY_DECIMAL] = this.p_type_gto_move_begin;
	}

	t[H.GTO] = this.p_type_gto_begin;
	t[H.GSB] = this.p_type_gosub_begin;
	t[H.LBL] = this.p_type_label_begin;
	if (H.type === "15c") {
		t[H.GTO_DOT] = this.p_type_gto_dot_begin;
		t[H.GSB_DOT] = this.p_type_gosub_dot_begin;
		t[H.LBL_DOT] = this.p_type_label_dot_begin;
	}

	if (H.type === "11c" || H.type === "15c") {
		t[H.GG * 100 + H.RCL] = this.p_type_mem_info;
		t[H.FF * 100 + H.RCL] = this.p_type_user;
		if (H.type === "15c") {
			this.label_count = 25;
		} else {
			this.label_count = 15;
		}
	} else if (H.type === "16c") {
		t[H.FF * 100 + 0] = this.p_type_mem_info;
		this.label_count = 16;
	}

	for (var n = 0; n <= 9; ++n) {
		t[H.GTO_MOVE * 100 + n] = this.p_type_gto_move_n;
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
		if (H.type === "15c") {
			t[H.GTO_DOT * 100 + n] = this.p_type_gto_dot_n;
			t[H.GSB_DOT * 100 + n] = this.p_type_gosub_dot_n;
			t[H.LBL_DOT * 100 + n] = this.p_type_label_dot_n;
		}
	}

	var lc = this.label_count;
	if (H.type === "15c") {
		// label count goes up to 25 but we really want
		// here is the range of letters here (A..E).
		lc = 15;
	}

	for (n = 11; n <= lc; ++n) {
		t[H.GTO * 100 + n] = this.p_type_gto_n;
		t[H.GSB * 100 + n] = this.p_type_gosub_n;
		t[H.LBL * 100 + n] = this.p_type_label_n;
	}

	// 15c: no dot handling for index
	t[H.GTO * 100 + H.KEY_INDEX] = this.p_type_gto_n;
	t[H.GSB * 100 + H.KEY_INDEX] = this.p_type_gosub_n;

	this.execution_delay = 80;
	this.default_execution_delay = this.execution_delay;
	this.fast_stack = 0;

	this.stack_size = 4;
	if (H.type === "15c") {
		this.stack_size = 8;
	}
};

Hp12c_pgrm.p_encode_key = function (key, addr)
{
	var opcode;

	if (addr) {
		opcode = H.zeropad(key.toFixed(0), H.ram_ADDR_SIZE);
	} else {
		opcode = H.zeropad(key.toFixed(0), H.INSTRUCTION_SIZE);
	}

	return opcode;
};

Hp12c_pgrm.p_expand_opcode = function (modifier)
{
	var a = [];

	// Expands an opcode or modifier codified like 100 * op0 + op1
	if (modifier >= H.INSTRUCTION_MAX) {
		// composite modifier; recurse
		a = Hp12c_pgrm.p_expand_opcode(Math.floor(modifier / 100));
	}
	a.push(modifier % H.INSTRUCTION_MAX);
	return a;
};

Hp12c_pgrm.p_encode_modifier = function (modifier)
{
	if (modifier <= 0) {
		return "";
	}

	var opcode = "";
	var expanded = Hp12c_pgrm.p_expand_opcode(modifier);

	for (var i = 0; i < expanded.length; ++i) {
		opcode += Hp12c_pgrm.p_encode_key(expanded[i], 0) + ".";
	}

	return opcode;
};

Hp12c_pgrm.p_encode_instruction = function (modifier, key, addr)
{
	return Hp12c_pgrm.p_encode_modifier(modifier) +
	       Hp12c_pgrm.p_encode_key(key, addr);

};

Hp12c_pgrm.prototype.hex_opcode = function (instr)
{
	var op = instr.split(".");

	for (var i = 0; i < op.length; ++i) {
		var key = parseInt(op[i], 10);
		if (key >= 11 && key <= 16) {
			op[i] = (key - 1).toString(16);
		}
	}

	return op.join(".");
};

Hp12c_pgrm.prototype.shrunk_opcode = function (instr)
{
	var op = instr.split(".");

	var modifier = 0;
	var key = 0;

	key = parseInt(op[op.length - 1], 10);
	for (var i = 0; i < op.length - 1; ++i) {
		modifier = 100 * modifier + parseInt(op[i], 10);
	}

	var K = H.dispatcher.functions;
	if (K[key]) {
		var closure = K[key][modifier];
		if (closure) {
			if (closure.shrink === 1) {
				// convert 48 to "o"
				var skey = parseInt(op[op.length - 2], 10);
				if (skey === 48) {
					var iop = op.slice(0, op.length - 2);
					return iop.join(".") + ".o" + parseInt(op[op.length - 1], 10);
				}
			} else if (closure.shrink === 2) {
				// convert 11..15 to letter
				if (key >= 11 && key <= 16) {
					op[op.length - 1] = (key - 1).toString(16);
				}
			}
		}
	}

	return op.join(".");
};

Hp12c_pgrm.prototype.p_del = function (modifier, key, addr)
{
	var ip = H.machine.ip;
	var limit = H.machine.program_limit();

	if (ip <= 0 || ip > limit) {
		H.machine.ip = 0;
		return;
	}

	for (var e = ip; e < limit; ++e) {
		H.machine.ram[e] = H.machine.ram[e + 1];
	}
	H.machine.ram[limit] = H.STOP_INSTRUCTION;

	--H.machine.ip;
	--H.machine.program_size;
};

Hp12c_pgrm.prototype.p_poke = function (modifier, key, addr)
{
	if ((H.machine.ip + 1) >= H.ram_MAX) {
		console.log("pgrm: IP limit bumped");
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	if (H.machine.program_size >= H.ram_MAX) {
		console.log("pgrm: program size limit bumped");
		H.machine.display_error(H.ERROR_IP);
		return false;
	}
	++H.machine.ip;
	++H.machine.program_size;

	// anyone except 12C inserts instructions
	for (var e = H.ram_MAX - 1; e > H.machine.ip; --e) {
		H.machine.ram[e] = H.machine.ram[e - 1];
	}

	H.machine.ram[H.machine.ip] =
		Hp12c_pgrm.p_encode_instruction(modifier, key, addr);

	return true;
};

Hp12c_pgrm.prototype.p_sched = function ()
{
	var self = this;

	if (H.machine.program_mode >= H.RUNNING) {
		H.machine.display_pgrm();
		H.delay(function () {
			self.p_execute();
		}, this.execution_delay);
	}
};

Hp12c_pgrm.prototype.p_gto = function (label)
{
	var is_label = true;
	var new_ip = label;
	var low = 11; 			// key for letter 'A'
	var high = this.label_count;	// key for letter 'E' or 'F'

	if (H.type === "15c") {
		// 15C uses label 10-19 for LBL . 0-9
		low = 10;
		// letter A-F goes to 20-24
		high = 24;
	}

	if (label == H.KEY_INDEX) {
		// index-based gto
		if (H.machine.index >= 0) {
			// label in index
			new_ip = Math.floor(H.machine.index);
			if (new_ip >= this.label_count) {
				console.log("Invalid label in index: " + new_ip);
				return false;
			}
			if (new_ip >= 10 && H.type !== "15c") {
				// move from 10..14 to 11..15 range (letter keystrokes)
				// (15c uses range 20-24 for letters: no move!)
				new_ip += 1;
			}
		} else {
			// absolute address in index
			new_ip = Math.floor(Math.abs(H.machine.index));
			is_label = false;
			if (new_ip > H.machine.program_limit()) {
				console.log("Invalid IP in index: " + new_ip);
				return false;
			}
		}
	} else {
		// hard-coded label
		// in 11C and 16c, it is the key code for A-F (11.16)
	}

	if (is_label) {
		console.log("GTO to label " + new_ip);
		new_ip = this.find_label(new_ip);
		if (! new_ip) {
			console.log("... no such label");
			return false;
		}
	}

	console.log("GTO to ip " + new_ip);
	H.machine.ip = new_ip;
	return true;
};

Hp12c_pgrm.prototype.p_do_gto = function (addr)
{
	// handled in special way because it changes IP
	H.machine.rst_modifier(1);

	if (! this.p_gto(addr)) {
		H.machine.display_error(H.ERROR_IP);
		this.stop(2);
		return;
	}
};

Hp12c_pgrm.prototype.p_exec_gto = function (op)
{
	// if 15c, keys 11..15 translated to label range 20..24
	return this.p_do_gto(this.fix_label_key(op[1]));
};

Hp12c_pgrm.prototype.p_exec_gto_dot = function (op)
{
	return this.p_do_gto(op[2] + 10);
};

Hp12c_pgrm.prototype.p_do_gosub = function (addr)
{
	if (H.machine.call_stack.length >= this.stack_size) {
		H.machine.display_error(H.ERROR_RTN);
		this.stop(2);
		return;
	}

	var new_ip = this.find_label_or_index(addr);

	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		this.stop(2);
		return;
	}

	console.log("GSB label " + addr + " to " + new_ip);

	this.push_stack(new_ip);
};

Hp12c_pgrm.prototype.p_exec_gosub = function (op)
{
	// if 15c, keys 11..15 translated to label range 20..24
	return this.p_do_gosub(this.fix_label_key(op[1]));
};

Hp12c_pgrm.prototype.p_exec_gosub_dot = function (op)
{
	return this.p_do_gosub(op[2] + 10);
};

Hp12c_pgrm.prototype.p_exec_rtn = function (op)
{
	this.pop_stack();
	console.log("RTN to " + H.machine.ip);
	// do nothing since p_execute() will stop if ip=0
};

Hp12c_pgrm.prototype.p_exec_rs = function (op)
{
	++H.machine.ip;
	this.stop(0);
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.p_opcode_match = function (candidate, model, comparison_len)
{
	model = Hp12c_pgrm.p_expand_opcode(model);

	for (var i = 0; i < comparison_len; ++i) {
		if (candidate[i] != model[i]) {
			return false;
		}
	}

	return true;
};

Hp12c_pgrm.prototype.p_exec_handle_special = function (op)
{
	var handler = null;

	for (var prefix in this.exec_special) {
		if (typeof prefix !== "object") {
			var expected_len = this.exec_special[prefix][0];
			var suffix_len = this.exec_special[prefix][1];
			var f = this.exec_special[prefix][2];

			if (expected_len != op.length) {
				continue;
			}

			if (! Hp12c_pgrm.p_opcode_match(op, prefix, 
					expected_len - suffix_len)) {
				continue;
			}

			handler = f;
			break;
		}
	}
	
	if (handler) {
		handler.call(this, op);
	}

	return !!handler;
};

Hp12c_pgrm.prototype.find_label = function (lab)
{
	var template_modifier = H.LBL;
	var template_label = lab;
	if (H.type === "15c") {
		if (template_label >= 10 && template_label <= 19) {
			template_modifier = H.LBL_DOT;
			template_label -= 10;
		} else if (template_label >= 20 && template_label <= 24) {
			template_label -= 20;
			template_label += 11;
		}
	}
	var template = Hp12c_pgrm.p_encode_instruction(template_modifier, template_label, 0);
	var i;

	// two-phase search to handle repeated labels correctly
	for (i = H.machine.ip + 1; i <= H.machine.program_limit(); ++i) {
		if (H.machine.ram[i] == template) {
			return i;
		}
	}
	for (i = 1; i <= H.machine.ip; ++i) {
		if (H.machine.ram[i] == template) {
			return i;
		}
	}

	console.log("find_label: not found " + lab);
	return 0;
};

Hp12c_pgrm.prototype.find_label_or_index = function (label_or_index)
{
	if (label_or_index === H.KEY_INDEX) {
		if (H.machine.index >= 0) {
			// label in index
			var label = Math.floor(H.machine.index);
			if (label >= this.label_count) {
				console.log("find_label_or_index: Invalid label in index: " + label);
				return 0;
			}
			if (label >= 10 && H.type !== "15c") {
				// put in 11..count range (= letter keys)
				// 15C: no gap, no change!
				label += 1;
			}
			return this.find_label(label);
		} else {
			// absolute address in index
			var new_ip = Math.floor(Math.abs(H.machine.index));
			if (new_ip > H.machine.program_limit()) {
				return 0;
			}
			return new_ip;
		}
	}

	return this.find_label(label_or_index);
};

Hp12c_pgrm.prototype.clean_stack = function ()
{
	H.machine.call_stack = [];
};

Hp12c_pgrm.prototype.push_stack = function (ip)
{
	H.machine.call_stack.push(H.machine.ip + 1);
	H.machine.ip = ip;
};

Hp12c_pgrm.prototype.pop_stack = function ()
{
	if (H.machine.call_stack.length <= 0) {
		H.machine.ip = 0;
		return false;
	}

	var ip = H.machine.call_stack[H.machine.call_stack.length - 1];
	H.machine.call_stack.splice(H.machine.call_stack.length - 1, 1);

	if (ip > H.machine.program_limit()) {
		console.log("RTN to EOF, defaulting to 0");
		ip = 0;
	}

	H.machine.ip = ip;

	return true;
};

Hp12c_pgrm.prototype.p_execute = function ()
{
	if (H.machine.program_mode < H.RUNNING) {
		return;
	}

	if (! H.keyboard.enabled()) { // we are inside a pause; resched to later
		this.p_sched();
		return;
	}

	if (H.machine.ip > H.machine.program_limit()) {
		// top of RAM
		// in 12c, pop_stack() always fails because GSB is never called
		this.pop_stack();

		if (H.machine.ip <= 0) {
			this.clean_stack();
			this.stop(0);
			return;
		} else {
			console.log("implicit RTN to " + H.machine.ip);
		}
	}

	// should never happen; tested by error injection in stack
	if (H.machine.ip <= 0) {
		H.machine.ip = 1;
		H.machine.display_pgrm();
	}

	var op_txt = H.machine.ram[H.machine.ip];

	// should never happen; tested by error injection in stack
	if (! H.is_12c()) {
		if (op_txt == H.STOP_INSTRUCTION || op_txt === "") {
			// bumped soft end of program (GTO 00)
			H.machine.ip = 0;
			this.stop(0);
			return;
		}
	}

	var op = op_txt.split(".");

	var log = op_txt + "   " + H.machine.x;
	if (H.type === "15c") {
		log += ":" + H.machine.xi;
		if (H.machine.xh) {
			log += ":M";
		}
	}

	var e;

	for (e = 0; e < op.length; ++e) {
		op[e] = parseInt(op[e], 10);
	}

	if (! this.p_exec_handle_special(op)) {
		// not special; execute via dispatcher

		for (e = 0; e < op.length; ++e) {
			if (!H.dispatcher.dispatch_common(op[e], true)) {
				console.log("Invalid opcode for exec: " + op_txt);
			}
		}

		if (H.machine.program_mode >= H.RUNNING || ! H.machine.error_in_display) {
			// sticks at error opcode
			++H.machine.ip;
		}
	}

	log += " -> " + H.machine.x;
	if (H.type === "15c") {
		log += ":" + H.machine.xi;
		if (H.machine.xh) {
			log += ":M";
		}
	}
	console.log(log);

	// instruction execution aftermath

	if (H.machine.ip <= 0) {
		// GTO 00, RTN to empty, or equivalent
		this.stop(0);
	} else if (H.machine.program_mode === H.RUNNING_STEP) {
		H.machine.program_mode = H.INTERACTIVE;
		H.machine.display_pgrm();
	} else if (H.machine.program_mode === H.RUNNING) {
		this.p_sched();
	}
	// Warning: 15c's SOLVE and INTG put machine in interactive
	// mode so they can run the programmed function
};

Hp12c_pgrm.prototype.p_run_step = function ()
{
	H.machine.program_mode = H.RUNNING_STEP;
	if (H.machine.ip <= 0) {
		H.machine.ip = 1;
	}
	H.machine.display_pgrm();
	this.p_sched();
};

Hp12c_pgrm.prototype.p_run = function ()
{
	H.machine.program_mode = H.RUNNING;
	if (H.machine.ip <= 0) {
		this.clean_stack();
		H.machine.ip = 1;
	}
	H.machine.display_pgrm();
	this.p_sched();
};

Hp12c_pgrm.prototype.run = function ()
{
	this.p_run();
};

Hp12c_pgrm.prototype.rs = function ()
{
	// when executing program, p_exec_rs is called instead
	if (H.machine.program_mode == H.INTERACTIVE) {
		H.machine.display_result_s(false, false);
		this.p_run();
	}
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.p_type_pr = function (key)
{
	// P/R in prog. mode exits programming mode
	H.machine.rst_modifier(1);
	H.machine.program_mode = H.INTERACTIVE;
	if (H.is_12c()) {
		H.machine.ip = 0;
	}
	H.machine.display_pgrm();
	H.machine.display_modifier();
	H.machine.display_result_s(false, false);
};

Hp12c_pgrm.prototype.p_type_sst = function (key)
{
	if (++H.machine.ip > H.machine.program_limit()) {
		H.machine.ip = 0;
	}
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_bst = function (key)
{
	if (--H.machine.ip < 0) {
		H.machine.ip = H.machine.program_limit();
	}
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_del = function (modifier, key, addr)
{
	this.p_del();
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_clear_pgrm = function (key)
{
	H.machine.clear_prog(1);
	H.machine.rst_modifier(1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_mem_info = function (key)
{
	H.machine.rst_modifier(1);
	H.machine.mem_info();
};

Hp12c_pgrm.prototype.p_type_user = function (key)
{
	H.machine.rst_modifier(1);
	H.machine.toggle_user();
};

Hp12c_pgrm.prototype.p_type_gto_move_n = function (key)
{
	H.machine.gtoxx = "" + H.machine.gtoxx + key.toFixed(0);
	if (H.machine.gtoxx.length >= H.ram_ADDR_SIZE) {
		var ip = parseInt(H.machine.gtoxx, 10);
		H.machine.gtoxx = "";
		H.machine.rst_modifier(1);
		if (ip > H.machine.program_limit()) {
			H.machine.display_error(H.ERROR_IP);
			return;
		}
		H.machine.ip = ip;
	}
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.fix_label_key = function (key)
{
	if (H.type === "15c") {
		// move keys 11..15 to label range 20..24
		if (key >= 11 && key <= 15) {
			key = key - 11 + 20;
		}
	}
	return key;
};

Hp12c_pgrm.prototype.p_type_gto_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GTO, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gto_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GTO_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GSB, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.GSB_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gosub_begin = function (key)
{
	H.machine.set_modifier(H.GSB, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gosub_dot_begin = function (key)
{
	H.machine.set_modifier(H.GSB_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_label_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.LBL, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_label_dot_n = function (key)
{
	H.machine.rst_modifier(1);
	return this.p_poke(H.LBL_DOT, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_label_begin = function (key)
{
	H.machine.set_modifier(H.LBL, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_label_dot_begin = function (key)
{
	H.machine.set_modifier(H.LBL_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gto_move_begin = function (key)
{
	H.machine.set_modifier(H.GTO_MOVE, 1);
	H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.p_type_gto_begin = function (key)
{
	H.machine.set_modifier(H.GTO, 1);
	if (H.is_12c()) {
		H.machine.gtoxx = "";
	}
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_gto_dot_begin = function (key)
{
	H.machine.set_modifier(H.GTO_DOT, 1);
	H.machine.display_program_opcode();
	return true;
};

Hp12c_pgrm.prototype.p_type_handle_special = function (key)
{
	var handler = null;
	var op = H.machine.modifier * 100 + key;

	if (this.type_special[op]) {
		this.type_special[op].call(this, key);
		return true;
	}

	return false;
};


Hp12c_pgrm.prototype.type = function (key)
{
	if (this.p_type_handle_special(key)) {
		return false;
	}

	// non-special key; resolve using dispatcher mechanism

	if (H.dispatcher.handle_modifier(key, 1)) {
		H.machine.display_program_opcode();
		return false;
	}

	// non-special, non-modifier

	// USER already handled by dispatcher, even for pgrm mode

	var f = H.dispatcher.find_function(key, 1, 0);

	if (! f) {
		console.log("pgrm typing: no handler for " + key);
		H.machine.rst_modifier(1);
		H.machine.display_program_opcode();
		return false;
	}

	var m = H.machine.modifier;
	H.machine.rst_modifier(1);

	return this.p_poke(m, key, 0) && H.machine.display_program_opcode();
};

Hp12c_pgrm.prototype.stop = function (motive)
{
	H.machine.program_mode = H.INTERACTIVE;
	if (H.machine.ip > H.machine.program_limit()) {
		H.machine.ip = 0;
	}
	if (H.is_12c() && H.machine.error_in_display) {
		// in 12c, an error resets IP
		H.machine.ip = 0;
	}
	H.machine.display_pgrm();
	if (! H.machine.error_in_display) {
		if (H.type === "16c") {
			H.machine.display_result_s(false, true);
		} else {
			H.machine.display_result();
		}
	}
	
	H.machine.program_stopped(motive);
};

//////////////////////////////////////////////////////////////////////////
// Interactive mode commands
//////////////////////////////////////////////////////////////////////////

Hp12c_pgrm.prototype.sst = function ()
{
	if (H.machine.program_mode == H.INTERACTIVE) {
		this.p_run_step();
	}
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.bst = function ()
{
	if (H.machine.ip > 0) {
		--H.machine.ip;
	}
	H.machine.display_program_opcode();
	H.machine.cli("bst");

	H.delay(function () {
		H.machine.prog_bst_after();
	}, this.execution_delay);
	H.machine.rst_modifier(1);
};

Hp12c_pgrm.prototype.gto = function (label)
{
	if (! this.p_gto(label)) {
		H.machine.display_error(H.ERROR_IP);
		return;
	}

	if (H.type === "16c") {
		H.machine.display_result_s(false, true);
	} else {
		H.machine.display_result();
	}
};

Hp12c_pgrm.prototype.label = function (label)
{
	console.log("LBL #" + label);
};

Hp12c_pgrm.prototype.gosub = function (label)
{
	var new_ip = this.find_label_or_index(label);
	
	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		return false;
	}

	this.clean_stack();
	// this made execution to continue from current IP
	// which is certainly not desirable
	// this.push_stack(new_ip);
	H.machine.ip = new_ip;

	if (H.type === "16c") {
		H.machine.display_result_s(false, true);
	} else {
		H.machine.display_result();
	}
	this.p_run();

	return true;
};

Hp12c_pgrm.prototype.user = function (label)
{
	var new_ip = this.find_label(label);

	if (! new_ip) {
		H.machine.display_error(H.ERROR_IP);
		return;
	}

	H.machine.display_result();
	this.clean_stack();
	H.machine.ip = new_ip;

	console.log("USER: exec from ip " + H.machine.ip);

	this.p_run();
};

Hp12c_pgrm.prototype.rtn = function (label)
{
	// does not unwind stack in interactive mode
	H.machine.ip = 0;
};

Hp12c_pgrm.prototype.dis_table = null;

Hp12c_pgrm.prototype.add_dis = function (dmap, asm, reducible, m, k)
{
	var is_addr = false;
	var mnemonic = asm.toUpperCase();
	if (reducible) {
		if (m >= 10000) {
			// m+k that cannot be an opcode in RAM
			// (but there is another closure with the
			// same mnemonic that does the same task)
			return;
		}
	}
	var opcode = Hp12c_pgrm.p_encode_instruction(parseInt(m, 10),
							parseInt(k, 10),
							is_addr);
	dmap[opcode] = mnemonic;
};

Hp12c_pgrm.prototype.generate_dis_table = function ()
{
	var K = H.dispatcher.functions;
	var dmap = {};
	this.dis_table = dmap;

	for (var key in K) {
		if (K.hasOwnProperty(key)) {
			for (var modifier in K[key]) {
				if (K[key].hasOwnProperty(modifier)) {
					var closure = K[key][modifier];
					if (closure.asm) {
						this.add_dis(dmap, closure.asm,
								closure.reducible,
								modifier, key);
					}
				}
			}
		}
	}
};

Hp12c_pgrm.prototype.disassemble = function (opcode)
{
	if (! this.dis_table) {
		this.generate_dis_table();
	}

	if (H.is_12c()) {
		if (opcode.substr(0, 6) === "43.33.") {
			return "GTO " + opcode.substr(6);
		}
	}

	if (!this.dis_table[opcode]) {
		return "???";
	}

	return this.dis_table[opcode];
};

Hp12c_pgrm.prototype.fast = function ()
{
	++this.fast_stack;
	this.execution_delay = 0;
};

Hp12c_pgrm.prototype.slow = function ()
{
	if (this.fast_stack > 0) {
		--this.fast_stack;
	}
	if (this.fast_stack === 0) {
		this.execution_delay = this.default_execution_delay;
	}
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H */

"use strict";

function Hp12c_storage()
{
}

Hp12c_storage.prototype.instruction_table = "0123456789_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
Hp12c_storage.prototype.addr_prefix = "$";

Hp12c_storage.prototype.compress_opcode = function (op)
{
	var self = this;

	var c_op = "";
	var opcodelist = op.split('.');
	for (var e = 0; e < opcodelist.length; ++e) {
		var opcode = opcodelist[e];
		var lopcode = opcode.length;
		var nopcode = parseInt(opcode, 10);
		if (lopcode == H.INSTRUCTION_SIZE && nopcode >= 0 && nopcode <= 50) {
			c_op += self.instruction_table.charAt(nopcode);
		} else if (lopcode == H.ram_ADDR_SIZE) {
			c_op += self.addr_prefix; 
			if (nopcode < 64) {
				c_op += self.instruction_table.charAt(nopcode);
			} else {
				c_op += self.instruction_table.charAt(Math.floor(nopcode / 64));
				c_op += self.instruction_table.charAt(nopcode % 64);
			}
		} else {
			// invalid instruction
			return self.compress_opcode(H.STOP_INSTRUCTION);
		}
	}
	return c_op;
};

Hp12c_storage.prototype.decompress_opcode = function (c_op)
{
	var self = this;

	var op = "";
	var aop = [];
	var cc;
	var ncc;
	var err = 0;
	var addr_mode = 0;
	var addr_value = 0;

	for (var e = 0; e < c_op.length; ++e) {
		cc = c_op.charAt(e);
		if (cc == self.addr_prefix) {
			if ((aop.length < 1) || (addr_mode > 0)) {
				err = 1;
				break;
			}
			addr_mode = 1;
			continue;
		}
		ncc = self.instruction_table.indexOf(cc);
		if (ncc < 0) {
			err = 1;
			break;
		}
		if (addr_mode) {
			addr_value = (addr_value * 64) + ncc;
			if (addr_value >= Math.pow(10, H.ram_ADDR_SIZE)) {
				err = 1;
				break;
			}
			if (addr_value >= H.ram_MAX) {
				err = 1;
				break;
			}
			if (addr_mode == 1) {
				aop.push(H.zeropad(addr_value, H.ram_ADDR_SIZE));
			} else {
				aop[aop.length - 1] = H.zeropad(addr_value, H.ram_ADDR_SIZE);
			}
			addr_mode += 1;
		} else {
			if (ncc > 49) {
				err = 1;
				break;
			}
			aop.push(H.zeropad(ncc, H.INSTRUCTION_SIZE));
		}
	}

	if (err) {
		op = H.STOP_INSTRUCTION;
	} else if (aop.length > H.INSTRUCTION_TOKENS || aop.length < 1) { 
		op = H.STOP_INSTRUCTION;
	} else {
		op = aop.join('.');
		/*
		// protection against "old" 12c memory being loaded on 11c
		if (op == "43.33.000" && H.STOP_INSTRUCTION != op) {
			op = H.STOP_INSTRUCTION;
		}
		if (op == "43.33.00" && H.STOP_INSTRUCTION != op) {
			op = H.STOP_INSTRUCTION;
		}
		*/
	}

	return op;
};

Hp12c_storage.prototype.marshal_array = function (a, type)
{
	var self = this;

	var mtxt = "A" + type;

	for (var ex = 0; ex < a.length; ++ex) {
		var data = a[ex];
		if (type == 'X') {
			data = self.compress_opcode(data);
		}
		mtxt += "!" + data;
	}

	return mtxt;
};

Hp12c_storage.prototype.unmarshal_array = function (target, dst_name, mtxt)
{
	var self = this;

	var dst = target[dst_name]; // must be already filled with 0s or anything
	var type = mtxt.charAt(1);
	mtxt = mtxt.slice(3);
	var a = mtxt.split('!');

	if (dst_name === "mA" || dst_name === "mB" || dst_name === "mC" ||
			dst_name === "mD" || dst_name === "mE") {
		// target is matrix, and initially empty
		while (dst.length < a.length) {
			dst.push(0);
		}
	}

	for (var ex = 0; ex < a.length && ex < dst.length; ++ex) {
		if (type == 'N') {
			dst[ex] = parseFloat(a[ex]);
			if (H.badnumber(dst[ex])) {
				dst[ex] = 0;
			}
		} else {
			// programming opcode
			if (ex > 0) {
				dst[ex] = self.decompress_opcode(a[ex]);
			}
		}
	}

	return;
};

Hp12c_storage.prototype.save_memory2 = function (target)
{
	var self = this;

	var expires = new Date();
	expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // timezone irrelevant
	var sm = target.nvname + "=";
	var i, k;

	for (i = 0; i < target.nvN.length; ++i) {
		k = target.nvN[i];
		sm += k + ":" + target[k] + " ";
	}

	for (i = 0; i < target.nvAN.length; ++i) {
		k = target.nvAN[i];
		sm += k + ":" + self.marshal_array(target[k], 'N') + " ";
	}

	for (i = 0; i < target.nvAX.length; ++i) {
		k = target.nvAX[i];
		sm += k + ":" + self.marshal_array(target[k], 'X') + " ";
	}

	sm += "; expires=" + expires.toGMTString() + "; path=/";

	return sm;
};

Hp12c_storage.prototype.save = function ()
{
	var self = this;

	// WARNING this method is overridden by widgets!
	document.cookie = self.save_memory2(H.machine);
};

Hp12c_storage.prototype.get_memory = function ()
{
	var self = this;

	return self.save_memory2(H.machine);
};

Hp12c_storage.prototype.recover_memory2 = function (target, sserial)
{
	var self = this;

	var ck = sserial.split(';'); // gets all cookie variables for this site

	for (var f = 0; f < ck.length; ++f) {
		var cv = ck[f].split('=');      // split cookie variable name and value
		if (cv.length != 2) {
			continue;
		}
		cv[0] = H.trim(cv[0]);
		cv[1] = H.trim(cv[1]);
		if (cv[0] != H.type_cookie) {
			continue;
		}
		var sm = cv[1].split(' '); 	// internal variable separation
		for (var e = 0; e < sm.length; ++e) {
			var smpair = sm[e].split(':');  // each internal variable is name=value

			if (smpair.length == 2 && smpair[0].length > 0 &&
					smpair[1].length > 0 &&
					target[smpair[0]] !== undefined) {
				if (smpair[1].length >= 2 && smpair[1].charAt(0) == 'A') {
					self.unmarshal_array(target, smpair[0], smpair[1]);
				} else {
					target[smpair[0]] = parseFloat(smpair[1]);
					if (H.badnumber(target[smpair[0]])) {
						target[smpair[0]] = 0;
					}
				}
			}
		}
	}

	if (H.is_12c()) {
		return;
	}

	// calculate program_size
	H.machine.program_size = 1;
	for (e = 1; e < H.ram_MAX; ++e) {
		if (H.machine.ram[e] != H.STOP_INSTRUCTION) {
			H.machine.program_size += 1;
		} else {
			break;
		}
	}
};

Hp12c_storage.prototype.load = function ()
{
	var self = this;

	// gets all cookie variables for this site
	// WARNING this method is overridden by widgets!
	self.recover_memory2(H.machine, document.cookie);
};

Hp12c_storage.prototype.set_memory = function (txt)
{
	var self = this;

	self.recover_memory2(H.machine, txt);
};
/* HP-12C emulator 
 * Copyright (c) 2011 EPx.com.br.
 * All rights reserved.
 */

/*jslint white: true, undef: true, nomen: true, regexp: true, strict: true, browser: true, bitwise: true */
/*global H, Hp12c_display, Hp12c_keyboard, Hp12c_debug, Hp12c_machine, Hp12c_storage, Hp12c_dispatcher, Hp12c_pgrm */

"use strict";

function Close_hp12c()
{
	if (! Close_hp12c.done) {
		H.storage.save();
		Close_hp12c.done = 1;
	}
}
Close_hp12c.done = 0;

function Init_hp12c()
{
	H.display = new Hp12c_display();
	H.keyboard = new Hp12c_keyboard();
	H.debug = new Hp12c_debug(function (t) {
		return H.display.format_result_tuple(t);
	});
	H.machine = new Hp12c_machine();
	H.dispatcher = new Hp12c_dispatcher();
	H.pgrm = new Hp12c_pgrm();
	H.storage = new Hp12c_storage();

	H.machine.init();
	H.storage.load();
	H.machine.display_all();
	H.machine.sti("init");

	window.onunload = Close_hp12c;
	window.beforenunload = Close_hp12c;
	document.onunload = Close_hp12c;
	document.beforeunload = Close_hp12c;
}
H.touch_display = true;
