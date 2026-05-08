@echo off
cd "c:\Users\PHNID\Downloads\Sensual Massage Elite 247 Manila"
git status --porcelain > temp_status.txt
set /p STATUS=<temp_status.txt
if defined STATUS (
    echo Changes found, pushing to GitHub...
    git add .
    git commit -m "Push all changes"
    git push origin main
    echo Changes pushed successfully!
) else (
    echo No changes to push.
)
del temp_status.txt