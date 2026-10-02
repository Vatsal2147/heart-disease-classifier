const MODEL = {"columns": ["Age", "RestingBP", "Cholesterol", "FastingBS", "MaxHR", "Oldpeak", "Sex_M", "ChestPainType_ATA", "ChestPainType_NAP", "ChestPainType_TA", "RestingECG_Normal", "RestingECG_ST", "ExerciseAngina_Y", "ST_Slope_Flat", "ST_Slope_Up"], "scaledColumns": ["Age", "RestingBP", "Cholesterol", "MaxHR", "Oldpeak"], "mean": [53.51089325, 132.54030501, 244.51633987, 136.80936819, 0.72004357], "scale": [9.42747752, 17.98013939, 53.28955776, 25.44646308, 0.98962549], "coef": [0.16414779, 0.00467368, 0.0369225, 1.11686008, -0.22029153, 0.4461522, 1.33027121, -1.42710482, -1.23955131, -0.90227179, -0.0150458, -0.15411718, 1.01414734, 1.09065275, -1.1495114], "intercept": -0.89872666};

const $ = (id) => document.getElementById(id);

const controls = {
  age: $('age'),
  bp: $('bp'),
  chol: $('chol'),
  maxhr: $('maxhr'),
  oldpeak: $('oldpeak')
};

const outputs = {
  age: $('ageOut'),
  bp: $('bpOut'),
  chol: $('cholOut'),
  maxhr: $('maxhrOut'),
  oldpeak: $('oldpeakOut')
};

Object.keys(controls).forEach(key => {
  const input = controls[key];
  const output = outputs[key];
  const update = () => output.textContent = input.value;
  input.addEventListener('input', update);
  update();
});

function toggleButton(button) {
  button.classList.toggle('active');
  button.setAttribute('aria-pressed', button.classList.contains('active'));
}
$('fasting').addEventListener('click', e => toggleButton(e.currentTarget));
$('exercise').addEventListener('click', e => toggleButton(e.currentTarget));

function sigmoid(z) {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

function buildFeatures() {
  const sexM = $('sex').value === 'M' ? 1 : 0;
  const chest = $('chest').value;
  const ecg = $('ecg').value;
  const slope = $('slope').value;
  const exercise = $('exercise').classList.contains('active') ? 1 : 0;
  const fasting = $('fasting').classList.contains('active') ? 1 : 0;

  // Exact feature order from columns.pkl.
  return [
    Number($('age').value),
    Number($('bp').value),
    Number($('chol').value),
    fasting,
    Number($('maxhr').value),
    Number($('oldpeak').value),
    sexM,
    chest === 'ATA' ? 1 : 0,
    chest === 'NAP' ? 1 : 0,
    chest === 'TA' ? 1 : 0,
    ecg === 'Normal' ? 1 : 0,
    ecg === 'ST' ? 1 : 0,
    exercise,
    slope === 'Flat' ? 1 : 0,
    slope === 'Up' ? 1 : 0
  ];
}

function predict() {
  const x = buildFeatures();

  // StandardScaler was fitted only on these five columns:
  // Age, RestingBP, Cholesterol, MaxHR, Oldpeak.
  const scaledIndexes = [0, 1, 2, 4, 5];
  scaledIndexes.forEach((idx, j) => {
    x[idx] = (x[idx] - MODEL.mean[j]) / MODEL.scale[j];
  });

  let z = MODEL.intercept;
  for (let i = 0; i < MODEL.coef.length; i++) {
    z += MODEL.coef[i] * x[i];
  }
  return sigmoid(z);
}

$('predictionForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const probability = predict();
  const percent = probability * 100;
  const positive = probability >= 0.5;

  $('idleState').classList.add('hidden');
  $('resultContent').classList.remove('hidden');

  const p = $('probability');
  p.textContent = `${percent.toFixed(1)}%`;
  $('meterFill').style.width = `${percent}%`;

  const banner = $('resultBanner');
  const icon = $('resultIcon');
  const title = $('resultTitle');
  const text = $('resultText');

  if (positive) {
    p.style.color = '#ff7a7a';
    banner.style.borderColor = 'rgba(255,122,122,.25)';
    icon.style.background = 'rgba(255,122,122,.12)';
    icon.style.color = '#ff8b8b';
    icon.textContent = '!';
    title.textContent = 'Model predicts heart disease';
    text.textContent = 'The estimated probability is at or above the 50% decision threshold.';
  } else {
    p.style.color = '#35d6b5';
    banner.style.borderColor = 'rgba(53,214,181,.22)';
    icon.style.background = 'rgba(53,214,181,.12)';
    icon.style.color = '#35d6b5';
    icon.textContent = '✓';
    title.textContent = 'Model predicts no heart disease';
    text.textContent = 'The estimated probability is below the 50% decision threshold.';
  }
});

$('resetBtn').addEventListener('click', () => {
  $('predictionForm').reset();
  $('fasting').classList.remove('active');
  $('exercise').classList.remove('active');
  $('fasting').setAttribute('aria-pressed', 'false');
  $('exercise').setAttribute('aria-pressed', 'false');
  Object.keys(controls).forEach(key => outputs[key].textContent = controls[key].value);
  $('idleState').classList.remove('hidden');
  $('resultContent').classList.add('hidden');
  $('probability').style.color = '#35d6b5';
  $('meterFill').style.width = '0%';
});
