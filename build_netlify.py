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

if __name__ == '__main__':
    main()
