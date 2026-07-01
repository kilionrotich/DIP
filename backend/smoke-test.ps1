$ErrorActionPreference = ''Stop''
$base = ''http://localhost:5000''

function JPost($url, $body, $token) {
  $headers = @{ ''Content-Type'' = ''application/json'' }
  if ($token) { $headers[''Authorization''] = ''Bearer '' + $token }
  Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}
function JPut($url, $body, $token) {
  $headers = @{ ''Content-Type'' = ''application/json'' }
  if ($token) { $headers[''Authorization''] = ''Bearer '' + $token }
  Invoke-RestMethod -Method Put -Uri $url -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}
function JGet($url, $token) {
  $headers = @{}
  if ($token) { $headers[''Authorization''] = ''Bearer '' + $token }
  Invoke-RestMethod -Method Get -Uri $url -Headers $headers
}

$admin = JPost "$base/api/auth/login" @{ email = ''admin@example.com''; password = ''admin123'' } $null
$investor = JPost "$base/api/auth/login" @{ email = ''investor@example.com''; password = ''investor123'' } $null

$deal = JPost "$base/api/deals" @{
  title = ''Smoke Flow Deal''
  description = ''Flow''
  amount_required = 160000
  fixed_amount = 160000
  expected_return = 190000
  start_date = (Get-Date).ToString(''o'')
  end_date = (Get-Date).AddDays(40).ToString(''o'')
} $admin.token

$commit = JPost "$base/api/investments/$($deal.deal_id)/commit" @{
  investor_id = $investor.user.id
  amount = 160000
  mpesa_code = ''SMOKE-MPESA-002''
  proof_url = ''https://example.com/proof/smoke-002.jpg''
} $investor.token

$dealAfterCommit = JGet "$base/api/deals/$($deal.deal_id)" $investor.token
$verify = JPut "$base/api/investments/$($commit.investment.investment_id)/verify" @{} $admin.token
$profit = JPut "$base/api/profits/update" @{ investment_id = $commit.investment.investment_id; profit = 13000 } $admin.token
$payout = JPost "$base/api/payouts" @{ investment_id = $commit.investment.investment_id; capital = 160000; profit = 13000 } $admin.token
$close = JPut "$base/api/deals/$($deal.deal_id)/close" @{} $admin.token
$investorCompleted = JGet "$base/api/investments?status=completed" $investor.token

$result = [ordered]@{
  adminLoginRole = $admin.user.role
  investorLoginRole = $investor.user.role
  dealId = $deal.deal_id
  dealStatusAfterCreate = $deal.status
  investmentId = $commit.investment.investment_id
  investmentStatusAfterCommit = $commit.investment.status
  dealStatusAfterCommit = $dealAfterCommit.status
  investmentStatusAfterVerify = $verify.investment.status
  profitUpdateMessage = $profit.message
  payoutId = $payout.payout.payout_id
  dealStatusAfterClose = $close.deal.status
  investorCompletedInvestmentsCount = @($investorCompleted.investments).Count
}

$result | ConvertTo-Json -Depth 10
