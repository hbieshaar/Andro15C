/* Copyright (c) 2013 Elvis Pfützenreuter */

package br.com.epx.andro15c;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Environment;
import android.os.Vibrator;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.content.DialogInterface;
import android.webkit.*;
import android.os.Bundle;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.view.*;
import android.util.DisplayMetrics;
import android.widget.EditText;
import android.widget.Toast;
import android.app.AlertDialog;
import android.content.pm.PackageManager.NameNotFoundException;
import android.media.SoundPool;
import android.media.AudioManager;
import android.content.Context;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;
// import android.media.SoundPool.OnLoadCompleteListener;
import android.util.Log;

public class Andro15CActivity extends Activity {
	Vibrator vib;
	SoundPool soundpool;
	int click_handle;
	int key_feedback;
	boolean fullscreen_enabled;
	boolean free_version;
	int zoom_tweak;
	static int zoom_min = -9;
	static int zoom_max = +10;
	boolean wakelock_enabled;
	boolean portrait;
	int locklayout;
	int model = 0;
	AlertDialog.Builder alt_bld;
	AudioManager mgr;

	// This is where we store saved memory files.
	File path = new File(Environment.getExternalStorageDirectory() + "/Andro15C");
	// Filename extension for memory files
	String memExt = ".mem";

	private int getMargin(double width, double height) {
		double proportion = width / height;
		double hp_proportion = 1024.0 / (656.0 - 26);
		if (portrait) {
			hp_proportion = 984.0 / 1611.0;
		}
		int margin = 0;

		if (proportion > hp_proportion) {
			// limit is height; add margins to eat excess width
			margin = (int) (width - (height * hp_proportion)) / 2;
		} else {
			// limit is width; viewport takes care of this
			margin = 0;
		}

		return margin;
	}

	private int getVertMargin(double width, double height) {
		double proportion = width / height;
		double hp_proportion = 1024.0 / (656.0 - 26);
		if (portrait) {
			hp_proportion = 984.0 / 1611.0;
		}
		int margin = 0;

		if (proportion < hp_proportion) {
			// limit is width; add margins to eat excess height
			margin = (int) (height - (width * (1.0 / hp_proportion))) / 2;
		} else {
			// limit is height; viewport takes care of this
			margin = 0;
		}

		return margin;
	}

	private class HelloWebViewClient extends WebViewClient {
		@Override
		public boolean shouldOverrideUrlLoading(WebView view, String url) {
			// view.loadUrl(url);

			// Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
			// startActivity(browserIntent);

			Uri marketUri = Uri.parse("market://details?id=br.com.epx.andro12cd");
			Intent marketIntent = new Intent(Intent.ACTION_VIEW, marketUri);
			try {
				startActivity(marketIntent);
			} catch (ActivityNotFoundException e) {
			}

			return true;
		}
	}

	public String recvCookie() {
		SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);
		String cookie = sp.getString("c1", "empt");
		return cookie;
	}

	public void alertJS(String text) {
		Toast.makeText(this, "Alert JS:" + text, Toast.LENGTH_SHORT).show();
	}

	public void touchFeedback()
	{
		if (key_feedback == 1) {
			if (vib != null) {
				vib.vibrate(37);
			}
		} else if (key_feedback == 2) {
			if (vib != null) {
				vib.vibrate(10);
			}
		} else if (key_feedback == 3) {
			if (click_handle != 0) {
				/*
     			float streamVolumeCurrent = mgr.getStreamVolume(AudioManager.STREAM_MUSIC);
     			float streamVolumeMax = mgr.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
     			float volume = streamVolumeCurrent / streamVolumeMax;
     			soundpool.play(click_handle, volume, volume, 1, 0, 1);
				 */
				soundpool.play(click_handle, 1, 1, 1, 0, 1);
			}
		}
	}

	public void sendCookie(String c) {
		SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);
		SharedPreferences.Editor ed = sp.edit();
		ed.putString("c1", c);
		ed.commit();
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		MenuInflater inflater = getMenuInflater();
		inflater.inflate(R.menu.menu, menu);
		return true;
	}

	public void set_layoutlock(int new_value)
	{
		boolean old_portrait = portrait;
		locklayout = new_value;

		if (locklayout == 1) {
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		} else if (locklayout == 2) {
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
		} else {
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);			
		}

		portrait = (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);

		if (portrait != old_portrait) {
			update_fullscreen_html((WebView) findViewById(R.id.webview));
		}
	}

	public void wakelock(boolean new_value)
	{
		wakelock_enabled = new_value;
		findViewById(R.id.webview).setKeepScreenOn(wakelock_enabled);
	}

	public void change_zoom(int delta)
	{
		if (delta == 0) {
			zoom_tweak = 0;
		}
		zoom_tweak += delta;
		if (zoom_tweak < zoom_min) {
			zoom_tweak = zoom_min;
		} else if (zoom_tweak > zoom_max) {
			zoom_tweak = zoom_max;
		}
		update_fullscreen_html((WebView) findViewById(R.id.webview));
	}

	// File picker dialog for memory files
	private AlertDialog fileDg = null;
	private String[] fileList;
	private String lastFile = "";
	private int fileAction = 0, choice = -1;

	private void loadMemFile(int which)
	{
		if (which>=0) lastFile = fileList[which];
		if (lastFile.length() == 0) return;
		File file = new File(path, lastFile+memExt);
		try {
			// read the memory cookie from a previously written file (see below)
			FileReader in = new FileReader(file);
			BufferedReader inb = new BufferedReader(in);
			String c = inb.readLine();
			inb.close();
			// update the cookie on the Java side
			sendCookie(c);
			// force a reload of the memory on the JavaScript side (cf. hp15c-min-android.js)
			WebView webview = (WebView) findViewById(R.id.webview);
			webview.loadUrl( "javascript:H.storage.load()" );
			// update the display
			update_fullscreen_html((WebView) findViewById(R.id.webview));
			// give a brief feedback about which file was loaded
			Toast.makeText(this, "Loaded " + file, Toast.LENGTH_SHORT).show();
		} catch (IOException e) {
			Log.e("Andro15C", "couldn't read memory file: " + e.toString());
			Toast.makeText(this, "Couldn't load " + file, Toast.LENGTH_SHORT).show();
		}
	}

	private void saveMemFile(int which)
	{
		if (which>=0) lastFile = fileList[which];
		if (lastFile.length() == 0) return;
		File file = new File(path, lastFile+memExt);
		try {
			// write the memory cookie to a file in the data directory
			String c = recvCookie();
			FileWriter out = new FileWriter(file);
			out.write(c);
			out.close();
			// give a brief feedback about which file was saved
			Toast.makeText(this, "Saved " + file, Toast.LENGTH_SHORT).show();
		} catch (IOException e) {
			Log.e("Andro15C", "couldn't write memory file: " + e.toString());
			Toast.makeText(this, "Couldn't save " + file, Toast.LENGTH_SHORT).show();
		}
	}

	private void deleteMemFile(int which)
	{
		if (which>=0) lastFile = fileList[which];
		if (lastFile.length() == 0) return;
		File file = new File(path, lastFile+memExt);
		if (file.delete()) {
			Toast.makeText(this, "Deleted " + file, Toast.LENGTH_SHORT).show();
		} else {
			Toast.makeText(this, "Couldn't delete " + file, Toast.LENGTH_SHORT).show();
		}
	}

	private AlertDialog enterMemFile()
	{
		AlertDialog.Builder builder = new AlertDialog.Builder(this);

		builder.setTitle("Name of new memory file");
		final EditText input = new EditText(this);
		builder.setView(input);
		builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				lastFile = input.getText().toString();
				Log.d("File Picker", "new file "+lastFile);
				saveMemFile(-1);
			}
		});
		builder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				Log.d("File Picker", "cancel");
			}
		});
		fileDg = builder.show();
		return fileDg;
	}

	private AlertDialog chooseMemFile(int action)
	{
		FilenameFilter filter = new FilenameFilter() {
			public boolean accept(File dir, String filename) {
				File sel = new File(dir, filename);
				return filename.endsWith(memExt) && !sel.isDirectory();
			}
		};
		fileList = path.list(filter);
		fileAction = action;

		// remove filename extensions
		int n = fileList.length;
		for (int i = 0; i < n; i++)
			fileList[i] = fileList[i].substring(0, fileList[i].length()-memExt.length());
		// sort the list alphabetically
		java.util.Arrays.sort(fileList);
		// determine the item with the last file (if any)
		choice = -1;
		for (int i = 0; i < n; i++) {
			int cmp = fileList[i].compareTo(lastFile);
			if (cmp == 0) {
				choice = i;
				break;
			} else if (cmp > 0) {
				break;
			}
		}
		if (choice < 0) lastFile = "";

		if (action != 1 && (fileList == null || n <= 0)) {
			Toast.makeText(this, "No memory files found", Toast.LENGTH_SHORT).show();
			return null;
		}

		AlertDialog.Builder builder = new AlertDialog.Builder(this);

		builder.setTitle((action==0?"Load":action==1?"Save":"Delete") + " memory file" +
				(choice>=0?" ["+fileList[choice]+"]":"") +
				(n>0?" : "+n+(n>1?" files":" file"):""));
		if (fileList != null && fileList.length > 0) {
			builder.setSingleChoiceItems(fileList, choice, new DialogInterface.OnClickListener() {
				public void onClick(DialogInterface dialog, int which) {
					Log.d("File Picker", "choice: "+which+" "+fileList[which]);
					choice = which;
				}
			});
		}
		if (fileList.length > 0) {
			builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
				public void onClick(DialogInterface dialog, int id) {
					Log.d("File Picker", "action: "+fileAction);
					switch (fileAction) {
					case 0:
						loadMemFile(choice); break;
					case 1:
						saveMemFile(choice); break;
					case 2:
						deleteMemFile(choice); break;
					}
				}
			});
		}
		if (action==1) {
			builder.setNeutralButton("New", new DialogInterface.OnClickListener() {
				public void onClick(DialogInterface dialog, int id) {
					Log.d("File Picker", "create");
					enterMemFile();
				}
			});
		}
		builder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				Log.d("File Picker", "cancel");
			}
		});
	    fileDg = builder.show();
	    return fileDg;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		switch (item.getItemId()) {
		case R.id.feedback0:
			key_feedback = 0;
			break; 
		case R.id.feedback1:
			key_feedback = 1;
			break;
		case R.id.feedback2:
			key_feedback = 2;
			break;
		case R.id.feedback3:
			key_feedback = 3;
			break;
		case R.id.fullscreen0:
			fullscreen_enabled = false;
			update_fullscreen_win();
			update_fullscreen_html((WebView) findViewById(R.id.webview));
			break;
		case R.id.fullscreen1:
			fullscreen_enabled = true;
			update_fullscreen_win();
			update_fullscreen_html((WebView) findViewById(R.id.webview));
			break;
		case R.id.sleep1:
			wakelock(true);
			break;
		case R.id.sleep0:
			wakelock(false);
			break;
		case R.id.zoom0:
			change_zoom(0);
			break;
		case R.id.zoomplus:
			change_zoom(1);
			break;
		case R.id.zoomminus:
			change_zoom(-1);
			break;
		case R.id.locklayout2:
			set_layoutlock(2);
			break;
		case R.id.locklayout1:
			set_layoutlock(1);
			break;
		case R.id.locklayout0:
			set_layoutlock(0);
			break;
		case R.id.about:
			AlertDialog d = alt_bld.create();
			d.show();
			break;
		case R.id.load: {
			chooseMemFile(0);
			break;
		}
		case R.id.save:
			chooseMemFile(1);
			break;
		case R.id.delete:
			chooseMemFile(2);
			break;
		}
		SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);
		SharedPreferences.Editor ed = sp.edit();
		ed.putInt("key_feedback", key_feedback);
		ed.putBoolean("fullscreen", fullscreen_enabled);
		ed.putBoolean("wakelock_enabled", wakelock_enabled);
		ed.putInt("locklayout", locklayout);
		ed.putInt("zoom_tweak", zoom_tweak);
		ed.commit();
		return true;
	}

	public void update_fullscreen_win()
	{
		if (fullscreen_enabled) {
			getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
					WindowManager.LayoutParams.FLAG_FULLSCREEN);
		} else {
			getWindow().setFlags(0,
					WindowManager.LayoutParams.FLAG_FULLSCREEN);
		}
	}


	@Override
	public boolean onPrepareOptionsMenu(Menu menu)
	{
		super.onPrepareOptionsMenu(menu);
		menu.findItem(R.id.feedback0).setVisible(key_feedback == 3);
		menu.findItem(R.id.feedback1).setVisible(key_feedback == 0);
		menu.findItem(R.id.feedback2).setVisible(key_feedback == 1);
		menu.findItem(R.id.feedback3).setVisible(key_feedback == 2);
		menu.findItem(R.id.fullscreen0).setVisible(fullscreen_enabled && !free_version);
		menu.findItem(R.id.fullscreen1).setVisible(!fullscreen_enabled && !free_version);
		menu.findItem(R.id.sleep1).setVisible(!wakelock_enabled);
		menu.findItem(R.id.sleep0).setVisible(wakelock_enabled);
		menu.findItem(R.id.locklayout2).setVisible(locklayout == 1);
		menu.findItem(R.id.locklayout1).setVisible((locklayout != 1) && (locklayout != 2));
		menu.findItem(R.id.locklayout0).setVisible(locklayout == 2);
		menu.findItem(R.id.zoomminus).setVisible(zoom_tweak > zoom_min);
		menu.findItem(R.id.zoomplus).setVisible(zoom_tweak < zoom_max);
		menu.findItem(R.id.load).setVisible(path.exists());
		menu.findItem(R.id.save).setVisible(path.exists());
		menu.findItem(R.id.delete).setVisible(path.exists());
		return true;
	}

	public void update_fullscreen_html(WebView webview)
	{
		DisplayMetrics metrics = new DisplayMetrics();
		getWindowManager().getDefaultDisplay().getMetrics(metrics);

		int TitleBarHeight = 25;

		switch (metrics.densityDpi) {
		case 480: // DENSITY_XXHIGH from API level 16
			TitleBarHeight = 60;
			break;
		case 320: // DENSITY_XHIGH from API Level 9
			TitleBarHeight = 50;
			break;
		case DisplayMetrics.DENSITY_HIGH:
			TitleBarHeight = 38;
			break;
		case DisplayMetrics.DENSITY_MEDIUM:
			TitleBarHeight = 25;
			break;
		case DisplayMetrics.DENSITY_LOW:
			TitleBarHeight = 19;
			break;
		default:
			Log.d("Andro15C", "Unknown density" + metrics.densityDpi);
		}

		Log.d("Andro15C", "Estimated title bar " + TitleBarHeight);

		if (fullscreen_enabled) {
			// full screen, no title bar.
			TitleBarHeight = 0;
		}

		int height = metrics.heightPixels;
		int width = metrics.widthPixels;

		// discount for taskbar
		height -= TitleBarHeight;

		int margin = getMargin(0.0 + width, 0.0 + height);
		int vmargin = getVertMargin(0.0 + width, 0.0 + height);

		int tweak = zoom_tweak;

		while (tweak > 0 && margin > 0) {
			// when zooming in, use part of zoom factor to decrease margins,
			// if any
			--tweak;
			margin -= width * 5 / (100 * 2);
			if (margin < 0) {
				margin = 0;
			}
		}
		while (tweak > 0 && vmargin > 0) {
			// when zooming in, use part of zoom factor to decrease margins,
			// if any
			--tweak;
			vmargin -= height * 5 / (100 * 2);
			if (vmargin < 0) {
				vmargin = 0;
			}
		}

		ViewGroup.MarginLayoutParams p = ((ViewGroup.MarginLayoutParams) webview.getLayoutParams());
		p.setMargins(margin, vmargin, margin, vmargin);

		int tot = 1024;

		if (portrait) {
			tot = 984;
		}

		{
			int zoom = (int) Math.floor((5 * tweak + 100.0) * 
					(0.0 + width - 2 * margin) / tot);
			if (model == 1) {
				// For some reason, the Xelios 10 Pro doesn't render the webview correctly at
				// the default zoom levels (software bug?), but adding 1 fixes that.
				zoom++;
			}
			webview.setInitialScale(zoom);
			Log.w("SCREEN", "zoom" + "" + zoom + " width" + "" + width + " height" + "" + height +
					" margin" + "" + margin + " vmargin" + "" + vmargin + " tweak" + "" + tweak);
		}

		webview.setLayoutParams(p);

		if (portrait) {
			webview.loadUrl("file:///android_asset/indexv.html");
		} else {
			webview.loadUrl("file:///android_asset/index.html");
		}
	}

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		SharedPreferences sp = getPreferences(Activity.MODE_PRIVATE);
		free_version = false;
		key_feedback = sp.getInt("key_feedback", 1);
		fullscreen_enabled = sp.getBoolean("fullscreen", !free_version);
		locklayout = sp.getInt("locklayout", 0);
		zoom_tweak = sp.getInt("zoom_tweak", 0);
		wakelock_enabled = sp.getBoolean("wakelock_enabled", false);
		
		if (Build.MODEL.equals("Xelio 10 Pro")) {
			model = 1; // tweaks specific to Odys Xelio 10 Pro tablet
		}

		// set up the data path
		path.mkdirs();

		if (locklayout == 1) {
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		} else if (locklayout == 2) {
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
		} else {
			setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);			
		}

		portrait = (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);

		update_fullscreen_win();

		setContentView(R.layout.main);

		String app_ver;
		try {
			app_ver = this.getPackageManager().getPackageInfo(this.getPackageName(), 0).versionName;
		} catch (NameNotFoundException e) {
			app_ver = "1";
		}

		String msgb = getString(R.string.app_about);
		msgb = msgb.replace("@@", app_ver);

		alt_bld = new AlertDialog.Builder(this);
		alt_bld.setTitle("About");
		alt_bld.setMessage(msgb);
		alt_bld.setNeutralButton("Back", new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				dialog.cancel();
			}
		});

		vib = (Vibrator) getSystemService(VIBRATOR_SERVICE);
		mgr = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
		soundpool = new SoundPool(1, AudioManager.STREAM_MUSIC, 0);

		/*
     	soundpool.setOnLoadCompleteListener(new SoundPool.OnLoadCompleteListener() {
     		public void onLoadComplete(SoundPool soundp, int sampleId, int status) {
     			if (status == 0) {
     				click_handle = sampleId;
     			}
     		}
     	})
		 */;

		 click_handle = 0;
		 try {
			 click_handle = soundpool.load(getAssets().openFd("click.wav"), 1);
		 } catch (IOException e) {
			 Log.w("Andro15C", "Error loading click sound");
		 }

		 WebView webview = (WebView) findViewById(R.id.webview);
		 webview.getSettings().setJavaScriptEnabled(true);
		 webview.getSettings().setSupportZoom(true);
		 if (android.os.Build.VERSION.SDK_INT >= 18) {
			 webview.getSettings().setLoadWithOverviewMode(true);
		 }
		 webview.setWebViewClient(new HelloWebViewClient());
		 webview.addJavascriptInterface(this, "Portal");
		 webview.setFocusable(false);
		 webview.setFocusableInTouchMode(false);
		 webview.setVerticalScrollBarEnabled(false);
		 webview.setHorizontalScrollBarEnabled(false);
		 webview.setOnTouchListener(new View.OnTouchListener() {
			 public boolean onTouch(View v, MotionEvent event) {
				 return (event.getAction() == MotionEvent.ACTION_MOVE);
			 }
		 });

		 update_fullscreen_html(webview);
		 wakelock(wakelock_enabled);
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig) {
		// ignore orientation/keyboard change
		super.onConfigurationChanged(newConfig);
		portrait = (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT);
		WebView webview = (WebView) findViewById(R.id.webview);
		update_fullscreen_html(webview);
	}
}
