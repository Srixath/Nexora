use std::{process::Child, sync::Mutex};
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

pub fn run() {
    let builder = tauri::Builder::default().setup(|app| {
        #[cfg(debug_assertions)]
        let mut command = {
            let mut command = std::process::Command::new("node");
            command.arg(concat!(env!("CARGO_MANIFEST_DIR"), "/../server/bridge.mjs"));
            command
        };

        #[cfg(not(debug_assertions))]
        let mut command = {
            let resources = app.path().resource_dir()?;
            let node = resources.join("node-runtime").join("node.exe");
            let bridge = resources.join("bridge.cjs");
            let mut command = std::process::Command::new(node);
            command.arg(bridge);
            command
        };

        command
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
