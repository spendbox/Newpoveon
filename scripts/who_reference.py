"""Independent reference values for the WHO 2019 non-lab model (Western Sub-Saharan Africa).

Reads the authors' calibration file (whocvdrisk_t10_calparms_gbd_sens0.dta from
https://github.com/skkceu/stata) directly and re-implements whocvdrisk_erfc_score_v03.ado
in Python, so the TypeScript implementation can be checked against an independent copy.
Usage: python scripts/who_reference.py path/to/whocvdrisk_t10_calparms_gbd_sens0.dta
"""
import math, sys, json
import pandas as pd

d = pd.read_stata(sys.argv[1])
def cal(sex, year):
    y = 5 * (year // 5) if year <= 2015 else year
    r = d[(d.ccode == 'NGA') & (d.year == y) & (d.sex == ('Men' if sex == 'male' else 'Women'))].iloc[0]
    return r

def lp(sex, ep, age, sbp, bmi, smk):
    a, b, s = age - 60, bmi - 25, sbp - 120
    if ep == 'chd' and sex == 'male':
        return 0.073593*a + 0.0337219*b + 0.0133937*s + 0.5954767*smk - 0.0010432*a*b - 0.0001837*a*s - 0.0200831*a*smk
    if ep == 'chd' and sex == 'female':
        return 0.1049418*a + 0.0257616*b + 0.016726*s + 1.093132*smk - 0.0006537*a*b - 0.0001966*a*s - 0.0343739*a*smk
    if ep == 'str' and sex == 'male':
        return 0.097674*a + 0.0159518*b + 0.0227294*s + 0.4999862*smk - 0.0003516*a*b - 0.0004374*a*s - 0.0153895*a*smk
    return 0.1046105*a + 0.0036406*b + 0.0216741*s + 0.7399405*smk - 0.0000129*a*b - 0.0005311*a*s - 0.0203997*a*smk

S0 = {('male','chd'):0.9544258, ('female','chd'):0.9887124, ('male','str'):0.9848260, ('female','str'):0.9885706}

def risk(age, sex, sbp, bmi, smk, year=2017):
    c = cal(sex, year)
    out = {}
    for ep, col in (('chd','chdmi'), ('str','crbv')):
        p = 1 - S0[(sex, ep)] ** math.exp(lp(sex, ep, age, sbp, bmi, smk))
        out[ep] = 1 - math.exp(-math.exp(float(c[f'cal2_m2_cons_ep_{col}']) + float(c[f'cal2_m2_slope_ep_{col}']) * math.log(-math.log(1 - p))))
    return 1 - (1 - out['chd']) * (1 - out['str'])

cases = [
    (40,'male',120,22,0),(45,'male',140,27,1),(50,'female',130,30,0),(55,'female',160,24,1),
    (60,'male',150,31,0),(65,'female',170,28,0),(70,'male',180,26,1),(74,'female',120,20,0),
    (52,'male',118,23,0),(48,'female',145,35,1),(80,'male',200,35,1),(42,'female',110,19,0),
]
print(json.dumps([dict(age=a,sex=s,sbp=b,bmi=m,smoker=bool(k),risk=risk(a,s,b,m,k)) for a,s,b,m,k in cases], indent=1))
