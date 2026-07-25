# Release Preparation Skill

## Purpose
Automate the release preparation process for the Enterprise Skills Hub project, ensuring consistent versioning, changelog updates, and release documentation.

## When to Use
Use this skill when:
- Preparing a new release version
- Publishing changes to production
- Creating release notes for stakeholders
- Tagging a release in git

## Prerequisites
- All changes for the release are committed to the main branch
- Tests are passing (`npm run typecheck` and `npm run build`)
- CHANGELOG.md is up to date with all changes
- Version number is updated in package.json

## Release Preparation Steps

### 1. Pre-Release Checks
```bash
# Verify no uncommitted changes
git status

# Run type checking
npm run typecheck

# Build the project
npm run build

# Run tests (if implemented)
npm test
```

### 2. Version Update
Update version in `package.json` following semantic versioning:
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, backward compatible

```bash
# Example: Update to v0.1.0
# Edit package.json: "version": "0.1.0"
```

### 3. Sync package-lock.json
After updating the version in package.json, sync the lock file:

```bash
# Update package-lock.json with new version
npm install --package-lock-only

# Verify the version is updated in package-lock.json
grep '"version"' package-lock.json | head -1
```

**Important**: Always commit both `package.json` and `package-lock.json` together to ensure consistency.

### 4. CHANGELOG Update
Ensure CHANGELOG.md includes:
- All new features under "Added"
- All bug fixes under "Fixed"
- Breaking changes under "Breaking Changes"
- Deprecations under "Deprecated"
- Follow Keep a Changelog format

### 5. Commit Changes
```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v0.1.0"
```

### 6. Create Git Tag
```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main --tags
```

### 7. Build Release Artifacts
```bash
# Clean build
rm -rf .next
npm run build

# Verify build output
ls -la .next/
```

### 8. Create Release Notes
Generate release notes from CHANGELOG.md:
- Extract the section for the current version
- Format for GitHub Releases
- Include breaking changes prominently
- Add migration instructions if needed

### 9. GitHub Release (Optional)
```bash
# Using GitHub CLI
gh release create v0.1.0 \
  --title "Enterprise Skills Hub v0.1.0" \
  --notes-file release-notes.md \
  --target main
```

## Post-Release Steps

### 1. Verify Deployment
- Check application health: `curl http://localhost:3000/api/health`
- Verify readiness: `curl http://localhost:3000/api/ready`
- Check metrics: `curl http://localhost:3000/api/metrics`

### 2. Update Documentation
- Update README.md if needed
- Update DEPLOYMENT.md with any new deployment steps
- Update API documentation if endpoints changed

### 3. Notify Stakeholders
- Share release notes with team
- Update project roadmap
- Archive completed milestones

## Checklist Template

```markdown
## Release v0.1.0 Checklist

### Pre-Release
- [ ] All features implemented and tested
- [ ] Code review completed
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] CHANGELOG.md updated
- [ ] Version updated in package.json
- [ ] Documentation updated

### Release
- [ ] Changes committed
- [ ] Git tag created and pushed
- [ ] Release artifacts built
- [ ] GitHub release created (if applicable)

### Post-Release
- [ ] Deployment verified
- [ ] Health checks passing
- [ ] Stakeholders notified
- [ ] Next sprint planned
```

## Common Issues

### Build Fails After Version Update
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run typecheck`

### CHANGELOG Conflicts
- Use "Unreleased" section for ongoing changes
- Merge carefully when multiple features are in progress
- Follow Keep a Changelog format strictly

### Git Tag Already Exists
- Delete old tag: `git tag -d v0.1.0`
- Delete remote tag: `git push origin :refs/tags/v0.1.0`
- Create new tag with correct version

## Best Practices

1. **Semantic Versioning**: Always follow semver.org guidelines
2. **Atomic Releases**: One feature/fix per release when possible
3. **Test Before Tag**: Never tag without testing
4. **Document Breaking Changes**: Make them prominent in release notes
5. **Keep CHANGELOG Current**: Update as you go, not at release time
6. **Automate When Possible**: Use scripts for repetitive tasks
7. **Review Before Publish**: Double-check version numbers and changelog

## Related Files
- `package.json` - Version number
- `CHANGELOG.md` - Change history
- `README.md` - Project documentation
- `DEPLOYMENT.md` - Deployment instructions
- `.github/workflows/` - CI/CD automation (if implemented)

## Example Release Command Sequence

```bash
# 1. Final checks
npm run typecheck && npm run build

# 2. Update version (manual or automated)
# Edit package.json

# 3. Update CHANGELOG (manual)
# Edit CHANGELOG.md

# 4. Commit and tag
git add .
git commit -m "chore: release v0.1.0"
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main --tags

# 5. Build release
npm run build

# 6. Create GitHub release (optional)
gh release create v0.1.0 --generate-notes
```
