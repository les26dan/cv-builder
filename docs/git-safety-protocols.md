# Git Safety Protocols - MANDATORY

## 🚨 **CRITICAL: These protocols exist because we nearly lost 6+ hours of work**

**Date Created**: September 2, 2025  
**Reason**: Near-catastrophic data loss during merge conflict resolution  
**Status**: MANDATORY for all Git operations  

---

## 🛡️ **PRE-MERGE SAFETY PROTOCOL (MANDATORY)**

### **NEVER merge without following these steps:**

```bash
# 1. MANDATORY BACKUP (NO EXCEPTIONS)
cp -r ../ProjectName ../ProjectName-BACKUP-$(date +%Y%m%d-%H%M%S)

# 2. VERIFY WHAT YOU'RE MERGING
git log --oneline --graph -10
git diff HEAD..branch-to-merge --name-only
git status

# 3. CHECK FOR CRITICAL FILES
git diff HEAD..branch-to-merge --name-only | grep -E "(components/|services/|hooks/)"

# 4. DOCUMENT WHAT YOU'RE DOING
echo "Merging: $(git branch --show-current) <- branch-name" >> merge-log.txt
echo "Files affected: $(git diff HEAD..branch-to-merge --name-only | wc -l)" >> merge-log.txt
```

---

## ⚠️ **CONFLICT RESOLUTION RULES**

### **DANGEROUS COMMANDS (NEVER USE BLINDLY):**
```bash
git checkout --ours .     # DANGER: Could discard your work!
git checkout --theirs .   # DANGER: Could discard remote work!
```

### **SAFE CONFLICT RESOLUTION:**
```bash
# For unrelated histories (safest approach)
git merge --allow-unrelated-histories --strategy-option=theirs branch-name

# Manual file-by-file resolution
git checkout branch-with-your-work -- path/to/specific/file.tsx
git checkout remote-branch -- path/to/other/file.tsx

# Verify each resolution
git diff --cached path/to/file.tsx
```

### **UNDERSTANDING "OURS" vs "THEIRS":**
- **During merge**: `--ours` = current branch HEAD, `--theirs` = incoming branch
- **During rebase**: `--ours` = incoming changes, `--theirs` = your changes
- **ALWAYS verify which is which before using!**

---

## ✅ **POST-MERGE VERIFICATION (MANDATORY)**

```bash
# 1. VERIFY COMMIT HISTORY
git log --oneline -5

# 2. CHECK WHAT CHANGED
git diff HEAD~1 --name-only | head -20
git show --stat HEAD

# 3. VERIFY CRITICAL FILES EXIST
ls -la components/AICreditsCounter.tsx
ls -la components/SharedHeader.tsx
ls -la services/pdfGenerationService.ts

# 4. TEST CRITICAL FUNCTIONALITY
npm run build  # Must succeed
./start-server --clean  # Test server starts
# Manual verification of key features
```

---

## 🚨 **EMERGENCY RECOVERY PROTOCOL**

### **If you suspect data loss:**

1. **STOP IMMEDIATELY** - Don't make more commits
2. **Create emergency backup** of current state
3. **Compare with known good backup**:
   ```bash
   diff -r . "../ProjectName-BACKUP-TIMESTAMP" | head -20
   ```
4. **Restore critical files**:
   ```bash
   cp "../ProjectName-BACKUP-TIMESTAMP/components/CriticalFile.tsx" components/
   ```
5. **Test functionality** before continuing
6. **Document what was lost/restored**

---

## 📋 **MERGE CHECKLIST**

### **Before Merge:**
- [ ] Backup created with timestamp
- [ ] Reviewed what's being merged (`git diff --name-only`)
- [ ] Identified critical files that might conflict
- [ ] Documented merge intention

### **During Merge:**
- [ ] Used explicit conflict resolution strategy
- [ ] Verified each resolved file makes sense
- [ ] Did NOT use `--ours` or `--theirs` blindly

### **After Merge:**
- [ ] Verified commit history looks correct
- [ ] Checked critical files exist and have expected content
- [ ] Tested build succeeds
- [ ] Tested server starts and serves expected content
- [ ] Manually verified key functionality works

---

## 🎯 **HIGH-RISK SCENARIOS**

### **Unrelated Histories Merge:**
- **Risk**: Git can't find common ancestor
- **Symptoms**: "refusing to merge unrelated histories"
- **Safe approach**: Use `--allow-unrelated-histories` with explicit strategy

### **Large File Count Merges:**
- **Risk**: Easy to miss important conflicts in noise
- **Symptoms**: 100+ files in conflict
- **Safe approach**: Resolve conflicts in batches, verify each batch

### **Missing .git Folder Recovery:**
- **Risk**: Complete loss of history
- **Symptoms**: "not a git repository"
- **Safe approach**: Backup first, then carefully reconstruct history

---

## 💡 **AUTOMATION IDEAS (Future)**

```bash
# Pre-merge safety script
#!/bin/bash
create_backup() {
    cp -r ../$(basename $PWD) ../$(basename $PWD)-BACKUP-$(date +%Y%m%d-%H%M%S)
    echo "Backup created: ../$(basename $PWD)-BACKUP-$(date +%Y%m%d-%H%M%S)"
}

# Post-merge verification script
verify_merge() {
    echo "Verifying critical files..."
    critical_files=("components/AICreditsCounter.tsx" "components/SharedHeader.tsx")
    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo "ERROR: Critical file missing: $file"
            exit 1
        fi
    done
    echo "All critical files present ✅"
}
```

---

## 🏆 **SUCCESS METRICS**

- **Zero data loss incidents** since protocol implementation
- **All merges backed up** before execution
- **All conflicts explicitly resolved** (no blind `--ours`/`--theirs`)
- **All post-merge verifications passed**

---

**Remember: The backup you create before a merge might be the only thing standing between you and catastrophic data loss.**
