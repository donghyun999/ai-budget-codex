param(
  [Parameter(Mandatory = $true)]
  [string]$Path
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$resolved = (Resolve-Path -LiteralPath $Path).Path
$archive = [System.IO.Compression.ZipFile]::OpenRead($resolved)

try {
  function Read-Entry([string]$name) {
    $entry = $archive.GetEntry($name)
    if (-not $entry) { return $null }
    $reader = [System.IO.StreamReader]::new($entry.Open(), [System.Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
  }

  $sharedStrings = @()
  $sharedXmlText = Read-Entry 'xl/sharedStrings.xml'
  if ($sharedXmlText) {
    [xml]$sharedXml = $sharedXmlText
    foreach ($si in $sharedXml.sst.si) {
      $parts = @()
      foreach ($textNode in @($si.SelectNodes(".//*[local-name()='t']"))) {
        $parts += [string]$textNode.InnerText
      }
      $sharedStrings += ($parts -join '')
    }
  }

  [xml]$workbook = Read-Entry 'xl/workbook.xml'
  [xml]$rels = Read-Entry 'xl/_rels/workbook.xml.rels'
  $relMap = @{}
  foreach ($rel in $rels.Relationships.Relationship) {
    $relMap[$rel.Id] = $rel.Target
  }

  $result = @()
  foreach ($sheet in $workbook.workbook.sheets.sheet) {
    $relId = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $target = $relMap[$relId]
    $entryName = if ($target.StartsWith('/')) { $target.TrimStart('/') } else { 'xl/' + $target.TrimStart('/') }
    [xml]$sheetXml = Read-Entry $entryName
    $rows = @()
    foreach ($row in @($sheetXml.worksheet.sheetData.row)) {
      $cells = @()
      foreach ($cell in @($row.c)) {
        $type = [string]$cell.t
        $value = [string]$cell.v
        if ($type -eq 's' -and $value -ne '') {
          $value = $sharedStrings[[int]$value]
        } elseif ($type -eq 'inlineStr') {
          $value = (@($cell.is.SelectNodes(".//*[local-name()='t']")) | ForEach-Object { [string]$_.InnerText }) -join ''
        } elseif ($type -eq 'b') {
          $value = if ($value -eq '1') { 'TRUE' } else { 'FALSE' }
        }
        $cells += [ordered]@{
          ref = [string]$cell.r
          value = $value
          formula = if ($cell.f) { [string]$cell.f.InnerText } else { $null }
          style = if ($cell.s -ne $null) { [string]$cell.s } else { $null }
        }
      }
      if ($cells.Count -gt 0) { $rows += ,$cells }
    }

    $merges = @()
    foreach ($merge in @($sheetXml.worksheet.mergeCells.mergeCell)) {
      if ($merge.ref) { $merges += [string]$merge.ref }
    }

    $result += [ordered]@{
      name = [string]$sheet.name
      state = [string]$sheet.state
      dimension = [string]$sheetXml.worksheet.dimension.ref
      mergedRanges = $merges
      rows = $rows
    }
  }

  $result | ConvertTo-Json -Depth 10
} finally {
  $archive.Dispose()
}
