use std::{fs, path::Path};

const SIZE: usize = 32;

fn generate_windows_icon() -> std::io::Result<()> {
    let path = Path::new("icons/icon.ico");
    if path.exists() {
        return Ok(());
    }
    fs::create_dir_all("icons")?;

    // ICO containing one 32x32, 32-bit BGRA DIB. The simple cyan shield keeps
    // the preview installer self-contained until the final signed brand asset lands.
    let xor_size = SIZE * SIZE * 4;
    let and_stride = ((SIZE + 31) / 32) * 4;
    let and_size = and_stride * SIZE;
    let image_size = 40 + xor_size + and_size;
    let mut out = Vec::with_capacity(6 + 16 + image_size);

    out.extend_from_slice(&0u16.to_le_bytes()); // reserved
    out.extend_from_slice(&1u16.to_le_bytes()); // icon
    out.extend_from_slice(&1u16.to_le_bytes()); // one image
    out.push(SIZE as u8);
    out.push(SIZE as u8);
    out.push(0);
    out.push(0);
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&32u16.to_le_bytes());
    out.extend_from_slice(&(image_size as u32).to_le_bytes());
    out.extend_from_slice(&22u32.to_le_bytes());

    // BITMAPINFOHEADER. ICO DIB height includes XOR + AND masks.
    out.extend_from_slice(&40u32.to_le_bytes());
    out.extend_from_slice(&(SIZE as i32).to_le_bytes());
    out.extend_from_slice(&((SIZE * 2) as i32).to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&32u16.to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes());
    out.extend_from_slice(&(xor_size as u32).to_le_bytes());
    out.extend_from_slice(&0i32.to_le_bytes());
    out.extend_from_slice(&0i32.to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes());

    // DIB rows are bottom-up. Draw a cyan shield with a dark inset and S mark.
    for dib_y in 0..SIZE {
        let y = SIZE - 1 - dib_y;
        for x in 0..SIZE {
            let top = y >= 4 && y <= 8 && x >= 6 && x <= 25;
            let body_half = if y <= 23 { 10usize.saturating_sub((y.saturating_sub(8)) / 3) } else { 3 };
            let body = y >= 8 && y <= 27 && x >= 16usize.saturating_sub(body_half) && x <= 15 + body_half;
            let shield = top || body;
            let inner = y >= 9 && y <= 22 && x >= 10 && x <= 21;
            let s_mark = inner && ((y <= 11 && x >= 12 && x <= 19) || (y >= 15 && y <= 17 && x >= 12 && x <= 19) || (y >= 20 && x >= 12 && x <= 19) || (x == 11 && y >= 11 && y <= 15) || (x == 20 && y >= 17 && y <= 20));

            let (b, g, r, a) = if s_mark {
                (255, 255, 255, 255)
            } else if shield && inner {
                (26, 20, 16, 255)
            } else if shield {
                (220, 210, 0, 255)
            } else {
                (0, 0, 0, 0)
            };
            out.extend_from_slice(&[b, g, r, a]);
        }
    }
    out.resize(out.len() + and_size, 0);
    fs::write(path, out)
}

fn main() {
    generate_windows_icon().expect("failed to generate StanNet Shield Windows icon");
    tauri_build::build();
}
