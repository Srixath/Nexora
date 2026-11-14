#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(not(debug_assertions))]
use std::{process::Child, sync::Mutex};

#[cfg(not(debug_assertions))]
use tauri::{path::BaseDirectory, Manager};

#[cfg(not(debug_assertions))]
struct BridgeProcess(Mutex<Option<Child>>);

#[cfg(not(debug_assertions))]
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

pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(not(debug_assertions))]
    let builder = builder.setup(|app| {
        let node = app.path().resolve("resources/node-runtime/node.exe", BaseDirectory::Resource)?;
        let bridge = app.path().resolve("resources/bridge.cjs", BaseDirectory::Resource)?;
        let mut command = std::process::Command::new(node);
        command
            .arg(bridge)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null());
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let process = command.spawn()?;
        app.manage(BridgeProcess(Mutex::new(Some(process))));
        Ok(())
    });

    builder
        .run(tauri::generate_context!())
        .expect("error while running Nexora");
}

fn main() {
    nexora_lib::run();
}
