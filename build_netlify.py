import os
import shutil

def main():
    target = 'public'
    if os.path.exists(target):
        print(f"Removing existing {target} directory...")
        shutil.rmtree(target)
    
    os.makedirs(target, exist_ok=True)

    exclude = {target, '.git', '.gitignore', 'netlify.toml', 'build_netlify.py', 'server.py', 'tg_subscribers.json', 'scratch', 'global-coffee-landing', 'global-coffee-landing — копия'}

    for item in os.listdir('.'):
        if item in exclude:
            continue
        
        # Don't copy python scripts, logs, or pdfs
        if item.endswith('.py') or item.endswith('.log') or item.endswith('.pdf') or item.startswith('.'):
            continue

        src_path = item
        dst_path = os.path.join(target, item)

        if os.path.isdir(src_path):
            shutil.copytree(src_path, dst_path)
            print(f"Copied directory: {src_path} -> {dst_path}")
        else:
            shutil.copy2(src_path, dst_path)
            print(f"Copied file: {src_path} -> {dst_path}")

    # Copy all individual files from images/ directory to the root of public/ to handle root-level image references on static hosting
    images_dir = 'images'
    if os.path.exists(images_dir) and os.path.isdir(images_dir):
        for img_file in os.listdir(images_dir):
            img_path = os.path.join(images_dir, img_file)
            if os.path.isfile(img_path) and not img_file.startswith('.'):
                dst_img_path = os.path.join(target, img_file)
                shutil.copy2(img_path, dst_img_path)
                print(f"Copied image to root fallback: {img_path} -> {dst_img_path}")

if __name__ == '__main__':
    main()
