use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::PathBuf,
    process::{Child, Stdio},
    sync::Mutex,
};
use tauri::Manager;

struct BridgeProcess(Mutex<Option<Child>>);

impl Drop for BridgeProcess {
    fn drop(&mut self) {
        if let Ok(mut child) = self.0.lock() {
            if let Some(mut process) = child.take() {
                let _ = process.kill();
                let _ = process.wait();
            }
        }
    }
}

fn bridge_log_path() -> PathBuf {
    let base = std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir);
    base.join("Nexora").join("bridge.log")
}

fn log_bridge_error(message: &str) {
    let path = bridge_log_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(mut log) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(log, "{message}");
    }
}

#[tauri::command]
fn open_google_messages(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("google-messages") {
        window.unminimize().map_err(|error| error.to_string())?;
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(());
    }

    let url = "https://messages.google.com/web"
        .parse()
        .map_err(|error| error.to_string())?;
    tauri::WebviewWindowBuilder::new(
        &app,
        "google-messages",
        tauri::WebviewUrl::External(url),
    )
    .title("Google Messages")
    .inner_size(1120.0, 780.0)
    .min_inner_size(720.0, 560.0)
    .center()
    .build()
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn run() {
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_google_messages])
        .setup(|app| {
            #[cfg(debug_assertions)]
            let mut command = {
                let mut command = std::process::Command::new("node");
                command.arg(concat!(env!("CARGO_MANIFEST_DIR"), "/../server/bridge.mjs"));
                command
            };

            #[cfg(not(debug_assertions))]
            let mut command = {
                let executable = std::env::current_exe()?;
                let install_dir = executable
                    .parent()
                    .ok_or_else(|| std::io::Error::other("Nexora install folder could not be found"))?;
                let resources = install_dir.join("resources");
                let node = resources.join("node-runtime").join("node.exe");
                let bridge = resources.join("bridge.cjs");
                if !node.is_file() || !bridge.is_file() {
                    log_bridge_error(&format!(
                        "Bundled bridge files were not found. Node: {}. Bridge: {}.",
                        node.display(),
                        bridge.display()
                    ));
                }
                let mut command = std::process::Command::new(node);
                command.arg(bridge);
                command
            };

            command.stdin(Stdio::null());

            let log_path = bridge_log_path();
            if let Some(parent) = log_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            if let Ok(log) = OpenOptions::new().create(true).append(true).open(&log_path) {
                if let Ok(stderr) = log.try_clone() {
                    command.stdout(Stdio::from(log)).stderr(Stdio::from(stderr));
                } else {
                    command.stdout(Stdio::null()).stderr(Stdio::null());
                }
            } else {
                command.stdout(Stdio::null()).stderr(Stdio::null());
            }
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                command.creation_flags(0x08000000);
            }
            let process = match command.spawn() {
                Ok(process) => {
                    log_bridge_error("Bridge process started.");
                    Some(process)
                }
                Err(error) => {
                    log_bridge_error(&format!("Could not start bridge process: {error}"));
                    None
                }
            };
            app.manage(BridgeProcess(Mutex::new(process)));
            Ok(())
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running Nexora");
}
