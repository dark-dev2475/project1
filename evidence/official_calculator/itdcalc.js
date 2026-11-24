ItdCalc = {};
//Basic Calculator
ItdCalc.BasicCal = (function () {
    var tlim, taxold, taxnew;
    var TaxInd = function (assYr, cStatus, age, rstatus, tinc, ded) {
        //individual
        //old slab
        ttinc = zeroOrMore(tinc - ded);
        tlim = TaxLimit(assYr, cStatus, age, rstatus);
        taxold = TaxIndOld(tlim, ttinc);
        rebate87a = RebateCalculation(ttinc, taxold, 'old', assYr, rstatus, cStatus, age);
        surc = SurChargeCalculation(ttinc, taxold, 'old', assYr, cStatus, age, rstatus);
        ecess = parseInt((taxold - rebate87a + surc) * 4 / 100);
        taxold = taxold - rebate87a + surc + ecess;

        //new slab subrat
        if (assYr >= "2024") {
            tlim = TaxLimit(assYr, cStatus, age, rstatus, 'new');
            taxnew = TaxIndNew(tlim, tinc);
            rebate87a = RebateCalculation(tinc, taxnew, 'new', assYr, rstatus, cStatus, age);
            surc = SurChargeCalculation(tinc, taxnew, 'new', assYr, cStatus, age, rstatus);
            ecess = parseInt((taxnew - rebate87a + surc) * 4 / 100);
        }
        else {
            tlim = TaxLimit(assYr, cStatus, age, rstatus, 'new');
            taxnew = TaxIndNew(tlim, tinc);
            rebate87a = RebateCalculation(tinc, taxnew, 'new', assYr, rstatus, cStatus, age);
            surc = SurChargeCalculation(tinc, taxnew, 'new', assYr, cStatus, age, rstatus);
            ecess = parseInt((taxnew - rebate87a + surc) * 4 / 100);
        }

        taxnew = taxnew - rebate87a + surc + ecess;

        var obj = {};
        obj['TaxOld'] = taxold;
        obj['TaxNew'] = taxnew;
        if (taxold >= taxnew) {
            obj['TaxMsg'] = "You save Rs." + (taxold - taxnew) + " if you opt for New Tax Regime.";
        } else {
            obj['TaxMsg'] = "You save Rs." + (taxnew - taxold) + " if you opt for Old Tax Regime.";
        }
        return obj;
    }

    //Tax for AOP status (Basic Calculator)
    var TaxAop = function (assYr, cStatus, age, rstatus, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        tlim = TaxLimit(assYr, "AOP", age, rstatus);
        taxold = TaxIndOld(tlim, ttinc);
        rebate87a = 0;
        surc = 0;
        surc = SurChargeCalculation(ttinc, taxold, 'old', assYr, cStatus, age, rstatus);
        ecess = parseInt((taxold - rebate87a + surc) * 4 / 100);
        taxold = taxold - rebate87a + surc + ecess;

        //new slab subrat
        if (assYr >= "2024") {
            tlim = TaxLimit(assYr, cStatus, age, rstatus, 'new');
            taxnew = TaxIndNew(tlim, tinc);
            rebate87a = RebateCalculation(tinc, taxnew, 'new', assYr, rstatus, cStatus, age);
            surc = SurChargeCalculation(tinc, taxnew, 'new', assYr, cStatus, age, rstatus);
            ecess = parseInt((taxnew - rebate87a + surc) * 4 / 100);
        }
        else {
            tlim = TaxLimit(assYr, cStatus, age, rstatus, 'new');
            taxnew = TaxIndNew(tlim, tinc);
            rebate87a = RebateCalculation(tinc, taxnew, 'new', assYr, rstatus, cStatus, age);
            surc = SurChargeCalculation(tinc, taxnew, 'new', assYr, cStatus, age, rstatus);
            ecess = parseInt((taxnew - rebate87a + surc) * 4 / 100);
        }

        taxnew = taxnew - rebate87a + surc + ecess;

        var obj = {};
        obj['TaxOld'] = taxold;
        obj['TaxNew'] = taxnew;
        if (taxold >= taxnew) {
            obj['TaxMsg'] = "You save Rs." + (taxold - taxnew) + " if you opt for New Tax Regime.";
        } else {
            obj['TaxMsg'] = "You save Rs." + (taxnew - taxold) + " if you opt for Old Tax Regime.";
        }
        return obj;
    }

    //Tax for Firm status (Basic Calculator)
    var TaxFirm = function (assYr, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        var tax = 0;
        var surc = 0;
        var ecess = 0;
        tax = parseInt((ttinc) * 0.30);
        if (ttinc >= 10000000) {
            surc = parseInt(tax * 0.12);
        }
        ecess = parseInt((tax + surc) * 0.04);
        totaltax = tax + surc + ecess;
        var obj = {};
        obj['TaxOld'] = totaltax;
        obj['TaxNew'] = 0;
        obj['TaxMsg'] = "NA";
        return obj;
    }

    //Tax for Company Domestic status (Basic Calculator)
    var TaxCompDomestic = function (assYr, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        var tax = 0;
        var surc = 0;
        var ecess = 0;
        tax = parseInt((ttinc) * 0.30);
        if (ttinc > 10000000 && ttinc <= 100000000) {
            surc = parseInt(tax * 0.07);
        } else if (ttinc > 100000000) {
            surc = parseInt(tax * 0.12);
        }
        ecess = parseInt((tax + surc) * 0.04);
        totaltax = tax + surc + ecess;
        var obj = {};
        obj['TaxOld'] = totaltax;
        obj['TaxNew'] = 0;
        obj['TaxMsg'] = "NA";
        return obj;
    }

    //Tax for Company foreign status (Basic Calculator)  
    var TaxCompForeign = function (assYr, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        var tax = 0;
        var surc = 0;
        var ecess = 0;
        if (parseInt(assYr) >= 2025) {
            tax = parseInt((ttinc) * 0.35);
        } else {
            tax = parseInt((ttinc) * 0.40);
        }
        if (ttinc > 10000000 && ttinc <= 100000000) {
            surc = parseInt(tax * 0.02);
        } else if (ttinc > 100000000) {
            surc = parseInt(tax * 0.05);
        }
        ecess = parseInt((tax + surc) * 0.04);
        totaltax = tax + surc + ecess;
        var obj = {};
        obj['TaxOld'] = totaltax;
        obj['TaxNew'] = 0;
        obj['TaxMsg'] = "NA";
        return obj;
    }

    //Tax for Trust status (Basic Calculator)
    var TaxTrust = function (assYr, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        var tax = 0;
        var surc = 0;
        var ecess = 0;
        tax = parseInt((ttinc) * 0.30);
        surc = parseInt(tax * 0.37);
        ecess = parseInt((tax + surc) * 0.04);
        totaltax = tax + surc + ecess;
        var obj = {};
        obj['TaxOld'] = totaltax;
        obj['TaxNew'] = 0;
        obj['TaxMsg'] = "NA";
        return obj;
    }

    //Tax for Cooperative society status (Basic Calculator)
    var TaxCoopSociety = function (assYr, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        var tax = 0;
        var surc = 0;
        var ecess = 0;
        tax = TaxCoop(ttinc);
        if (ttinc > 10000000 && ttinc <= 100000000) {
            surc = parseInt(tax * 0.07);
        } else if (ttinc > 100000000) {
            surc = parseInt(tax * 0.12);
        }
        ecess = parseInt((tax + surc) * 0.04);
        totaltax = tax + surc + ecess;
        var obj = {};
        obj['TaxOld'] = totaltax;
        obj['TaxNew'] = 0;
        obj['TaxMsg'] = "NA";
        return obj;
    }

    // Tax for Cooperative society status 115BAD (Basic Calculator)
    var TaxCoopSociety115BAD = function (assYr, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        var tax = 0;
        var surc = 0;
        var ecess = 0;
        tax = parseInt((ttinc) * 0.22);
        surc = parseInt(tax * 0.10);
        ecess = parseInt((tax + surc) * 0.04);
        totaltax = tax + surc + ecess;
        var obj = {};
        obj['TaxOld'] = totaltax;
        obj['TaxNew'] = 0;
        obj['TaxMsg'] = "NA";
        return obj;
    }

    //Tax for Cooperative society status 115BAE (Basic Calculator)
    var TaxCoopSociety115BAE = function (assYr, tinc, ded) {
        ttinc = zeroOrMore(tinc - ded);
        var tax = 0;
        var surc = 0;
        var ecess = 0;
        tax = parseInt((ttinc) * 0.15);
        surc = parseInt(tax * 0.10);
        ecess = parseInt((tax + surc) * 0.04);
        totaltax = tax + surc + ecess;
        var obj = {};
        obj['TaxOld'] = totaltax;
        obj['TaxNew'] = 0;
        obj['TaxMsg'] = "NA";
        return obj;
    }

    return {
        GetTaxCal: function (assYr, cStatus, age, rstatus, tinc, ded, total_taxable_incm_nw, exemptions_allowed_old_regime, deductions_allowed_old_regime) {
            if (cStatus == "IND" || cStatus == "HUF") {
                tinc = total_taxable_incm_nw;
                ded = exemptions_allowed_old_regime + deductions_allowed_old_regime;
                return TaxInd(assYr, cStatus, age, rstatus, tinc, ded);
            } else if (cStatus == "AOP") { //aop/boi
                tinc = total_taxable_incm_nw;
                ded = exemptions_allowed_old_regime + deductions_allowed_old_regime;
                return TaxAop(assYr, cStatus, age, rstatus, tinc, ded);
            } else if (cStatus == "FIRM" || cStatus == "LLP") {
                return TaxFirm(assYr, tinc, ded);
            } else if (cStatus == "COMPD") {
                return TaxCompDomestic(assYr, tinc, ded);
            } else if (cStatus == "COMPF") {
                return TaxCompForeign(assYr, tinc, ded);
            } else if (cStatus == "TRUST") {
                return TaxTrust(assYr, tinc, ded);
            } else if (cStatus == "COOP") {
                return TaxCoopSociety(assYr, tinc, ded);
            } else if (cStatus == "COOP115BAD") {
                return TaxCoopSociety115BAD(assYr, tinc, ded);
            } else if (cStatus == "COOP115BAE") {
                return TaxCoopSociety115BAE(assYr, tinc, ded);
            }
        }
    }

})();

//tax on lottery income 30 %
var lotteryTax = 0;
//tax on long term income taxable @20%
var lt20tax = 0;
//tax on long term income taxable @10%
var lt10tax = 0;
//tax on long term income taxable @10% (u/s 112)
var lt11210tax = 0;
//tax on short term income taxable @15%
var st15tax = 0;
// tax on short term income taxable @20% 
var lt30tax = 0;
// tax on short term income taxable @30%
var lt40tax = 0;
// tax on dividend 115AC, 115AD income taxable @10%
var dividend115AC10tax = 0;
// tax on dividend 115ACA income taxable @10%
var dividend115ACA_10tax = 0;
// tax on dividend 115A income taxable @20%
var dividend115A_20tax = 0;
// tax on dividend 115AD income taxable @20%
var dividend115_AD_20tax = 0;
// tax on dividend 210 income taxable @10%
var dividend210_10tax = 0;
// tax on dividend 208 income taxable @10%
var dividend208_10tax = 0;
// tax on dividend 115AD income taxable @20%
var onlineGame115BBJtax = 0;
// interest taxable on 115A @5%
var interest_taxable5tax = 0;
// interest taxable on 115A FII @5%
var interest_taxable_5_115Atax = 0;
// interest taxable on 115A Proviso @4%
var intrestAt4per115AP = 0;
// interest taxable on 115A Proviso @4%
var intrestAt10per115AC = 0;
var intrestAt20per115AC = 0;
// tax on long term income taxable @12.5% (u/s 112)
var lt11211tax = 0;
// tax on long term income taxable @10% FII
var lt11310tax = 0;
// tax on long term income taxable @12.5% FII
var lt112A_12Ttax = 0;
// tax on long term income taxable @12.5% (other than 112)
var lt11410tax = 0;

//tax on short term income taxable at applicable rate
var stnmtax = 0;
//tax on Dividend income Taxable at Normal rates taxable at applicable rate
var dinmtax = 0;
//INtrest u/s 234A,B,C
var Int234A, Int234B, Int234C, Int234F;
//assYr (assessment year),oldnewslab (slab option selected),cStatus (asesse status),rstatus (residential status),stnm (short term applicable rate),st15a short term Taxable @15%,lt20 (long term @20%),lt10 (long term 10%),bpinc business income,bp44ad business 44AD income
var assYr, oldnewslab, cStatus, age, rstatus, normalinc, lotteryinc, hpinc, stnm, stnm1, stnm2, stnm3, stnm4, stnm5, st15a, st15A1, st15A2, st15A3, st15A4, st15A5, lt20, lt201, lt202, lt203, lt204, lt205, lt10, lt101, lt102, lt103, lt104, lt105, lt30, lt301, lt302, lt303, lt304, lt305, lt40, lt401, lt402, lt403, lt404, lt405, tds, bpinc, bp44ad, incomeManuf_Busnss, dividend_taxable10per, dividend_taxable10per_1, dividend_taxable10per_2, dividend_taxable10per_3, dividend_taxable10per_4, dividend_taxable10per_5, dividend_taxable_115aca, dividend_taxable_115aca_1, dividend_taxable_115aca_2, dividend_taxable_115aca_3, dividend_taxable_115aca_4, dividend_taxable_115aca_5, dividend_taxable20, dividend_taxable20_1, dividend_taxable20_2, dividend_taxable20_3, dividend_taxable20_4, dividend_taxable20_5, dividend_taxable_115ad, dividend_taxable_10_210_N, dividend_taxable_10_208_N, dividend_taxable_115ad_1, dividend_taxable_115ad_2, dividend_taxable_115ad_3, dividend_taxable_115ad_4, dividend_taxable_115ad_5, dividend_taxable_10_210_N_1, dividend_taxable_10_210_N_2, dividend_taxable_10_210_N_3, dividend_taxable_10_210_N_4, dividend_taxable_10_210_N_5, dividend_taxable_10_208_N_1, dividend_taxable_10_208_N_2, dividend_taxable_10_208_N_3, dividend_taxable_10_208_N_4, dividend_taxable_10_208_N_5, online_games_115bbj, online_games_115bbj_1, online_games_115bbj_2, online_games_115bbj_3, online_games_115bbj_4, online_games_115bbj_5, inning_lottery1, inning_lottery2, inning_lottery3, inning_lottery4, inning_lottery5, dinm, dinm1, dinm2, dinm3, dinm4, dinm5, interest_taxable5per_6a, interest_taxable_5_115A, interest_taxable_4_Proviso, interest_taxable_9_6b_N, interest_taxable_10_115AC, interest_Taxable_20115A_115E, interest_Taxable_20_115AD, interest_Taxable_10_210_6e_N, income_chargeable60115BBE, income_chargeable115BBF_10, recognised_provident_fund_taxable_6jtax, income_chargeable115BBG_10, income_chargeable115BBA, income_from_royalty10;
//Tax on normal income
var TaxNormal = 0;
//slab limit
var slablimit = 0;
var slablimitorg = 0;
//total income,special rate income
var tinc, spinc;
var tstax, TAXWO44AD, TAX44AD;
var TaxBfrRebate, rebate87a, TaxAftrRebate, surc, ecess, TotalTax;
var stnmtx1, stnmtx2, stnmtx3, stnmtx4, stnmtx5, st15tx1, st15tx2, st15tx3, st15tx4, st15tx5, lt20tx1, lt20tx2, lt20tx3, lt20tx4, lt20tx5, lt10tx1, lt10tx2, lt10tx3, lt10tx4, lt10tx5, lt30tx1, lt30tx2, lt30tx3, lt30tx4, lt30tx5, lt11210tx1, lt11210tx2, lt11210tx3, lt11210tx4, lt11210tx5, lt11211tx1, lt11211tx2, lt11211tx3, lt11211tx4, lt11211tx5, lt11410tx1, lt11410tx2, lt11410tx3, lt11410tx4, lt11410tx5, lt11310tx1, lt11310tx2, lt11310tx3, lt11310tx4, lt11310tx5, lt40tx1, lt40tx2, lt40tx3, lt40tx4, lt40tx5, dividend115AC10tx1, dividend115AC10tx2, dividend115AC10tx3, dividend115AC10tx4, dividend115AC10tx5, dividend115ACA_10tx1, dividend115ACA_10tx2, dividend115ACA_10tx3, dividend115ACA_10tx4, dividend115ACA_10tx5, dividend115A_20tx1, dividend115A_20tx2, dividend115A_20tx3, dividend115A_20tx4, dividend115A_20tx5, dividend115_AD_20tx1, dividend115_AD_20tx2, dividend115_AD_20tx3, dividend115_AD_20tx4, dividend115_AD_20tx5, dividend210_10tx1, dividend210_10tx2, dividend210_10tx3, dividend210_10tx4, dividend210_10tx5, dividend208_10tx1, dividend208_10tx2, dividend208_10tx3, dividend208_10tx4, dividend208_10tx5, onlineGame115BBJtx1, onlineGame115BBJtx2, onlineGame115BBJtx3, onlineGame115BBJtx4, onlineGame115BBJtx5, lotteryTx1, lotteryTx2, lotteryTx3, lotteryTx4, lotteryTx5, dinmtax1, dinmtax2, dinmtax3, dinmtax4, dinmtax5, lt112A_12T1tax, lt112A_12T2tax, lt112A_12T3tax, lt112A_12T4tax, lt112A_12T5tax;
//period wise tax,
var PTAX, PTAX1, PTAX2, PTAX3, PTAX4, PTAX5, cg112and111A, cg112and111ATax, PTAX234C, PTAX1234C, PTAX2234C, PTAX3234C, PTAX4234C, PTAX5234C;
//Advance tax period wise
var adv1, adv2, adv3, adv4, adv5, selftax;
//long term u/s 112A period wise income and tax
var lt11210, lt112101, lt112102, lt112103, lt112104, lt112105;
var lt11211, lt112111, lt112112, lt112113, lt112114, lt112115;
var lt11410, lt114101, lt114102, lt114103, lt114104, lt114105;
var lt11310, lt113101, lt113102, lt113103, lt113104, lt113105;
var lt11210tx1, lt11210tx2, lt11210tx3, lt11210tx4, lt11210tx5;
var lt112A_12T, lt112A_12T1, lt112A_12T2, lt112A_12T3, lt112A_12T4, lt112A_12T5;
//AyStDt (Assessment year start date),FyStDt (Financial year start date),FyEdDt (Financial Year End Date)
var AyStDt, FyStDt, FyEdDt;
//Determine which type of calculation to be run eg Basic, estimator or Advance
var framework = "";

var refund, refundClaim, refundAmtPayable, regAssTax, aggLiability, addIncomeTaxLiability, netAmountPayable;

//Main calculation used in advance and estimator
ItdCalc.AdvCalc = (function () {
    return {
        GetTaxCal: function (js) {
            framework = js.framework;       //for calculator or estimator or basic
            assYr = js.assYr.substring(0, 4);   //assessment year
            if (js.oldnewslab != "new") {        // old or new slab
                oldnewslab = "old";
            } else {
                oldnewslab = "new";
            }
            cStatus = js.cStatus;       //client status individual(IND),HUF, firm etc
            rstatus = js.rstatus;       //residential status
            age = js.age;               //age Senior citizon(SR),Normal(NM), super senior citizen(SSR)
            if (age != "SSR" && age != "SR") {
                age = "NM";
            }

            //short term capital gain normal income stnm total, and 1,2,3,4,5 for periodwise bifurcation
            stnm = coalesce(js.stnm);
            stnm1 = coalesce(js.stnm1);
            stnm2 = coalesce(js.stnm2);
            stnm3 = coalesce(js.stnm3);
            stnm4 = coalesce(js.stnm4);
            stnm5 = coalesce(js.stnm5);
            //Dividend income Taxable at Normal rates normal income total, and 1,2,3,4,5 for periodwise bifurcation
            dinm = coalesce(js.taxable_normal_rates);
            dinm1 = coalesce(js.taxable_normal_rates1);
            dinm2 = coalesce(js.taxable_normal_rates2);
            dinm3 = coalesce(js.taxable_normal_rates3);
            dinm4 = coalesce(js.taxable_normal_rates4);
            dinm5 = coalesce(js.taxable_normal_rates5);
            //short term capital gain u/s 115A @15%
            st15a = coalesce(js.st15A);
            st15A1 = coalesce(js.st15A1);
            st15A2 = coalesce(js.st15A2);
            st15A3 = coalesce(js.st15A3);
            st15A4 = coalesce(js.st15A4);
            st15A5 = coalesce(js.st15A5);

            //long term capital gain @20%
            lt20 = coalesce(js.lt20);
            lt201 = coalesce(js.lt201);
            lt202 = coalesce(js.lt202);
            lt203 = coalesce(js.lt203);
            lt204 = coalesce(js.lt204);
            lt205 = coalesce(js.lt205);
            // Short Term Capital Gains Charged to tax 20
            lt30 = coalesce(js.lt30);
            lt301 = coalesce(js.lt301);
            lt302 = coalesce(js.lt302);
            lt303 = coalesce(js.lt303);
            lt304 = coalesce(js.lt304);
            lt305 = coalesce(js.lt305);
            // Short term capital gains charged to tax 30
            lt40 = coalesce(js.lt40);
            lt401 = coalesce(js.lt401);
            lt402 = coalesce(js.lt402);
            lt403 = coalesce(js.lt403);
            lt404 = coalesce(js.lt404);
            lt405 = coalesce(js.lt405);
            // dividend under head Other Sources charged to tax 10
            dividend_taxable10per = coalesce(js.dividend_taxable10per);
            dividend_taxable10per_1 = coalesce(js.dividend_taxable10per_1);
            dividend_taxable10per_2 = coalesce(js.dividend_taxable10per_2);
            dividend_taxable10per_3 = coalesce(js.dividend_taxable10per_3);
            dividend_taxable10per_4 = coalesce(js.dividend_taxable10per_4);
            dividend_taxable10per_5 = coalesce(js.dividend_taxable10per_5);
            // dividend ACA under head Other Sources charged to tax 10
            dividend_taxable_115aca = coalesce(js.dividend_taxable_115aca);
            dividend_taxable_115aca_1 = coalesce(js.dividend_taxable_115aca_1);
            dividend_taxable_115aca_2 = coalesce(js.dividend_taxable_115aca_2);
            dividend_taxable_115aca_3 = coalesce(js.dividend_taxable_115aca_3);
            dividend_taxable_115aca_4 = coalesce(js.dividend_taxable_115aca_4);
            dividend_taxable_115aca_5 = coalesce(js.dividend_taxable_115aca_5);
            // dividend 115A under head Other Sources charged to tax 20
            dividend_taxable20 = coalesce(js.dividend_taxable20);
            dividend_taxable20_1 = coalesce(js.dividend_taxable20_1);
            dividend_taxable20_2 = coalesce(js.dividend_taxable20_2);
            dividend_taxable20_3 = coalesce(js.dividend_taxable20_3);
            dividend_taxable20_4 = coalesce(js.dividend_taxable20_4);
            dividend_taxable20_5 = coalesce(js.dividend_taxable20_5);
            // dividend 115AD under head Other Sources charged to tax 20
            dividend_taxable_115ad = coalesce(js.dividend_taxable_115ad);
            dividend_taxable_115ad_1 = coalesce(js.dividend_taxable_115ad_1);
            dividend_taxable_115ad_2 = coalesce(js.dividend_taxable_115ad_2);
            dividend_taxable_115ad_3 = coalesce(js.dividend_taxable_115ad_3);
            dividend_taxable_115ad_4 = coalesce(js.dividend_taxable_115ad_4);
            dividend_taxable_115ad_5 = coalesce(js.dividend_taxable_115ad_5);
            // Dividend Taxable u/s 210(1) charged to tax 10
            dividend_taxable_10_210_N = coalesce(js.dividend_taxable_10_210_N);
            dividend_taxable_10_210_N_1 = coalesce(js.dividend_taxable_210_N_1);
            dividend_taxable_10_210_N_2 = coalesce(js.dividend_taxable_210_N_2);
            dividend_taxable_10_210_N_3 = coalesce(js.dividend_taxable_210_N_3);
            dividend_taxable_10_210_N_4 = coalesce(js.dividend_taxable_210_N_4);
            dividend_taxable_10_210_N_5 = coalesce(js.dividend_taxable_210_N_5);
            // Dividend Taxable u/s 208(1) charged to tax 10
            dividend_taxable_10_208_N = coalesce(js.dividend_taxable_10_208_N);
            dividend_taxable_10_208_N_1 = coalesce(js.dividend_taxable_208_N_1);
            dividend_taxable_10_208_N_2 = coalesce(js.dividend_taxable_208_N_2);
            dividend_taxable_10_208_N_3 = coalesce(js.dividend_taxable_208_N_3);
            dividend_taxable_10_208_N_4 = coalesce(js.dividend_taxable_208_N_4);
            dividend_taxable_10_208_N_5 = coalesce(js.dividend_taxable_208_N_5);
            // Winnings (from Lottery, Crossword Puzzles, etc.) 30%
            lotteryinc = coalesce(js.lotteryinc);
            inning_lottery1 = coalesce(js.inning_lottery1);
            inning_lottery2 = coalesce(js.inning_lottery2);
            inning_lottery3 = coalesce(js.inning_lottery3);
            inning_lottery4 = coalesce(js.inning_lottery4);
            inning_lottery5 = coalesce(js.inning_lottery5);
            // dividend 115AD under head Other Sources charged to tax 20
            online_games_115bbj = coalesce(js.online_games_115bbj);
            online_games_115bbj_1 = coalesce(js.online_games_115bbj_1);
            online_games_115bbj_2 = coalesce(js.online_games_115bbj_2);
            online_games_115bbj_3 = coalesce(js.online_games_115bbj_3);
            online_games_115bbj_4 = coalesce(js.online_games_115bbj_4);
            online_games_115bbj_5 = coalesce(js.online_games_115bbj_5);
            //long term capital gain other than u/s 112A  @10%
            lt10 = coalesce(js.lt10);
            lt101 = coalesce(js.lt101);
            lt102 = coalesce(js.lt102);
            lt103 = coalesce(js.lt103);
            lt104 = coalesce(js.lt104);
            lt105 = coalesce(js.lt105);
            //long term capital gain u/s 112A @10%
            lt11210 = coalesce(js.lt11210);
            lt112101 = coalesce(js.lt112101);
            lt112102 = coalesce(js.lt112102);
            lt112103 = coalesce(js.lt112103);
            lt112104 = coalesce(js.lt112104);
            lt112105 = coalesce(js.lt112105);
            //long term capital gain u/s 112A @12.5%
            lt11211 = coalesce(js.lt11211);
            lt112111 = coalesce(js.lt112111);
            lt112112 = coalesce(js.lt112112);
            lt112113 = coalesce(js.lt112113);
            lt112114 = coalesce(js.lt112114);
            lt112115 = coalesce(js.lt112115);
            // Long Term Capital Gains us 112A Charged to tax @12.5% other than 112 Total
            lt11410 = coalesce(js.lt11410);
            lt114101 = coalesce(js.lt114101);
            lt114102 = coalesce(js.lt114102);
            lt114103 = coalesce(js.lt114103);
            lt114104 = coalesce(js.lt114104);
            lt114105 = coalesce(js.lt114105);
            // Long Term Capital Gains us 112A Charged to tax 10 By FII Total
            lt11310 = coalesce(js.lt11310);
            lt113101 = coalesce(js.lt113101);
            lt113102 = coalesce(js.lt113102);
            lt113103 = coalesce(js.lt113103);
            lt113104 = coalesce(js.lt113104);
            lt113105 = coalesce(js.lt113105);
            // Long Term Capital Gains us 112A Charged to tax 12.5 By FII Total
            lt112A_12T = coalesce(js.lt112A_12T);
            lt112A_12T1 = coalesce(js.lt112A_12T1);
            lt112A_12T2 = coalesce(js.lt112A_12T2);
            lt112A_12T3 = coalesce(js.lt112A_12T3);
            lt112A_12T4 = coalesce(js.lt112A_12T4);
            lt112A_12T5 = coalesce(js.lt112A_12T5);

            // Interest Taxable @5% 115A(1)(a)(iia),115A(1) (a)(iiaa),115A(1) (a)(iiac) etc/Interest Taxable @5%115A(1) (a)(iiab) (FII)
            interest_taxable5per_6a = coalesce(js.interest_taxable5per_6a);
            interest_taxable_5_115A = coalesce(js.interest_taxable5per_6b);
            interest_taxable_4_Proviso = coalesce(js.interest_taxable4per_6c);
            interest_taxable_9_6b_N = coalesce(js.interest_taxable9per_6b_N);
            interest_taxable_10_115AC = coalesce(js.interest_taxable10per_6d);
            interest_Taxable_20115A_115E = coalesce(js.interest_taxable20per_6e);
            interest_Taxable_20_115AD = coalesce(js.interest_taxable20per_6f);
            interest_Taxable_10_210_6e_N = coalesce(js.interestTaxable10per_210_6e_N);
            interest_Taxable_10_208_6f_N = coalesce(js.interestTaxable10per_208_6f_N);
            income_chargeable60115BBE = coalesce(js.interest_chargeable_115bbe_6g);
            income_chargeable115BBF_10 = coalesce(js.interest_chargeable_115bbf_6h);
            recognised_provident_fund_taxable_6jtax = coalesce(js.recognised_provident_fund_taxable_6j);
            income_chargeable115BBG_10 = coalesce(js.interest_chargeable_115bbg_6i);
            income_chargeable115BBA = coalesce(js.income_chargeable_115bba_6k);
            income_from_royalty10 = coalesce(js.income_from_royalty_or_fees_6l);

            tds = coalesce(js.Tds); //total tds
            bpinc = coalesce(js.bpinc); //total business income
            bp44ad = coalesce(js.bp44ad);   //business income u/s 44AD,AE etc
            incomeManuf_Busnss = coalesce(js.incomeManuf_Busnss); //Income from Manufacture Business
            hpinc = 0;  //house property income

            //salary income
            if (framework == "calculator" || oldnewslab == "old") {
                slinc = coalesce(js.slinc);
            } else if (oldnewslab == "new") {
                // slinc = coalesce(js.slincgs);
                // js.slinc = slinc;
                slinc = coalesce(js.slinc);
            }

            if (framework == "calculator" || oldnewslab == "old") {
                hpinc = coalesce(js.hpinc);
            } else if (oldnewslab == "new") {
                hpinc = coalesce(js.hpnetanv) - coalesce(js.hpstanded) - coalesce(js.hpintborrowcap);
            }

            //total capital gain
            cginc = parseInt(stnm, 10) + parseInt(st15a, 10) + parseInt(lt20, 10) + parseInt(lt10, 10) + parseInt(lt11210, 10) + parseInt(lt11211, 10) + parseInt(lt40, 10) + parseInt(lt30, 10) + parseInt(lt11310, 10) + parseInt(lt11410, 10) + parseInt(dividend_taxable10per, 10) + parseInt(dividend_taxable_115aca, 10) + parseInt(dividend_taxable20, 10) + parseInt(dividend_taxable_115ad, 10) + parseInt(dividend_taxable_10_210_N, 10) + parseInt(dividend_taxable_10_208_N, 10) + parseInt(online_games_115bbj, 10) + parseInt(lotteryinc, 10) + parseInt(interest_taxable5per_6a, 10) + parseInt(interest_taxable_5_115A, 10) + parseInt(interest_taxable_4_Proviso, 10) + parseInt(interest_taxable_9_6b_N, 10) + parseInt(dinm, 10) + parseInt(interest_taxable_10_115AC, 10) + parseInt(interest_Taxable_20115A_115E, 10) + parseInt(interest_Taxable_20_115AD, 10) + parseInt(interest_Taxable_10_210_6e_N, 10) + parseInt(interest_Taxable_10_208_6f_N, 10) + parseInt(income_chargeable60115BBE, 10) + parseInt(income_chargeable115BBF_10, 10) + parseInt(income_chargeable115BBG_10, 10) + parseInt(income_chargeable115BBA, 10) + parseInt(income_from_royalty10, 10) + parseInt(lt112A_12T, 10);

            //total other source income
            if (framework == "calculator") {
                osinc = coalesce(js.osinc);
                //  - coalesce(js.lotteryinc);
            } else {
                osinc = coalesce(js.osinc) - (coalesce(js.lotterycrossword) + coalesce(js.lotteryhourserace));
            }
            stnmtx1 = stnmtx2 = stnmtx3 = stnmtx4 = stnmtx5 = st15tx1 = st15tx2 = st15tx3 = st15tx4 = st15tx5 = lt20tx1 = lt20tx2 = lt20tx3 = lt20tx4 = lt20tx5 = lt10tx1 = lt10tx2 = lt10tx3 = lt10tx4 = lt10tx5 = lt30tx1 = lt30tx2 = lt30tx3 = lt30tx4 = lt30tx5 = lt11210tx1 = lt11210tx2 = lt11210tx3 = lt11210tx4 = lt11210tx5 = lt11211tx1 = lt11211tx2 = lt11211tx3 = lt11211tx4 = lt11211tx5 = lt11410tx1 = lt11410tx2 = lt11410tx3 = lt11410tx4 = lt11410tx5 = lt11310tx1 = lt11310tx2 = lt11310tx3 = lt11310tx4 = lt11310tx5 = lt40tx1 = lt40tx2 = lt40tx3 = lt40tx4 = lt40tx5 = dividend115AC10tx1 = dividend115AC10tx2 = dividend115AC10tx3 = dividend115AC10tx4 = dividend115AC10tx5 = dividend115ACA_10tx1 = dividend115ACA_10tx2 = dividend115ACA_10tx3 = dividend115ACA_10tx4 = dividend115ACA_10tx5 = dividend115A_20tx1 = dividend115A_20tx2 = dividend115A_20tx3 = dividend115A_20tx4 = dividend115A_20tx5 = dividend115_AD_20tx1 = dividend115_AD_20tx2 = dividend115_AD_20tx3 = dividend115_AD_20tx4 = dividend115_AD_20tx5 = dividend210_10tx1 = dividend210_10tx2 = dividend210_10tx3 = dividend210_10tx4 = dividend210_10tx5 = dividend208_10tx1 = dividend208_10tx2 = dividend208_10tx3 = dividend208_10tx4 = dividend208_10tx5 = onlineGame115BBJtx1 = onlineGame115BBJtx2 = onlineGame115BBJtx3 = onlineGame115BBJtx4 = onlineGame115BBJtx5 = lotteryTx1 = lotteryTx2 = lotteryTx3 = lotteryTx4 = lotteryTx5 = dinmtax1 = dinmtax2 = dinmtax3 = dinmtax4 = dinmtax5 = lt112A_12T1tax = lt112A_12T2tax = lt112A_12T3tax = lt112A_12T4tax = lt112A_12T5tax = parseInt('0', 10);

            if ((cStatus == "IND" || cStatus == "HUF" || cStatus == "FIRM" || cStatus == "COOP115BAD" || cStatus == "COOP115BAE") && rstatus != "NR") {
                bpinc = coalesce(js.bp44ad) + coalesce(js.bpoth);
            } else {
                bpinc = coalesce(js.bpoth);
                bp44ad = 0;
            }

            if (bpinc < 0) {
                bpinc = 0;
            }

            js.bpinc = bpinc + coalesce(js.incomeManuf_Busnss);

            //loss setoff of house property with other head income
            if (hpinc >= 0) {
                gti = slinc + hpinc + bpinc + cginc + osinc + incomeManuf_Busnss;
                normalinc = slinc + hpinc + bpinc + stnm + osinc + dinm;
            } else {
                if (oldnewslab == "new") {
                    hpinc = 0;
                    js.hpinc = 0;
                }
                hploss = Math.abs(hpinc);
                if (oldnewslab == "old") {
                    if (hploss > 200000) {
                        hploss = 200000;
                    }
                }
                if (slinc > 0) {
                    if (slinc > hploss) {
                        slinc = slinc - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - slinc;
                        slinc = 0;
                    }
                }

                if (osinc > 0) {
                    if (osinc > hploss) {
                        osinc = osinc - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - osinc;
                        osinc = 0;
                    }
                }

                if (dinm > 0) {
                    if (dinm > hploss) {
                        dinm = dinm - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - dinm;
                        dinm = 0;
                    }
                }

                if (bpinc > 0) {
                    if (bpinc > hploss) {
                        bpinc = bpinc - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - bpinc;
                        bpinc = 0;
                    }
                }

                if (incomeManuf_Busnss > 0) {
                    if (incomeManuf_Busnss > hploss) {
                        incomeManuf_Busnss = incomeManuf_Busnss - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - incomeManuf_Busnss;
                        incomeManuf_Busnss = 0;
                    }
                }

                if (stnm > 0) {
                    if (stnm > hploss) {
                        stnm = stnm - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - stnm;
                        stnm = 0;
                    }
                }

                if (lt30 > 0) {
                    if (lt30 > hploss) {
                        lt30 = lt30 - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - lt30;
                        lt30 = 0;
                    }
                }

                if (lt20 > 0) {
                    if (lt20 > hploss) {
                        lt20 = lt20 - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - lt20;
                        lt20 = 0;
                    }
                }

                if (st15a > 0) {
                    if (st15a > hploss) {
                        st15a = st15a - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - st15a;
                        st15a = 0;
                    }
                }

                if (lt11211 > 0) {
                    if (lt11211 > hploss) {
                        lt11211 = lt11211 - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - lt11211;
                        lt11211 = 0;
                    }
                }

                if (lt11410 > 0) {
                    if (lt11410 > hploss) {
                        lt11410 = lt11410 - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - lt11410;
                        lt11410 = 0;
                    }
                }

                if (lt10 > 0) {
                    if (lt10 > hploss) {
                        lt10 = lt10 - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - lt10;
                        lt10 = 0;
                    }
                }

                if (lt11210 > 0) {
                    if (lt11210 > hploss) {
                        lt11210 = lt11210 - hploss;
                        hploss = 0;
                    }
                    else {
                        hploss = hploss - lt11210;
                        lt11210 = 0;
                    }
                }

                // if (lt11310 > 0) {
                //     if (lt11310 > hploss) {
                //         lt11310 = lt11310 - hploss;
                //         hploss = 0;
                //     }
                //     else {
                //         hploss = hploss - lt11310;
                //         lt11310 = 0;
                //     }
                // }
                // if (lt112A_12T > 0) {
                //     if (lt112A_12T > hploss) {
                //         lt112A_12T = lt112A_12T - hploss;
                //         hploss = 0;
                //     }
                //     else {
                //         hploss = hploss - lt112A_12T;
                //         lt112A_12T = 0;
                //     }
                // }

                // if (lt40 > 0) {
                //     if (lt40 > hploss) {
                //         lt40 = lt40 - hploss;
                //         hploss = 0;
                //     }
                //     else {
                //         hploss = hploss - lt40;
                //         lt40 = 0;
                //     }
                // }              

                cginc = stnm + st15a + lt20 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + dinm + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable60115BBE + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T;

                gti = slinc + bpinc + cginc + osinc + incomeManuf_Busnss;
                // if (js.itrType == 'updated') {
                //     gti = gti - hploss;
                // }
                normalinc = slinc + bpinc + stnm + osinc + dinm;
            }

            //gross total income
            js.gti = gti;

            //check wether senior citizen with no business income
            isSrNoBP = false;
            if (cStatus == "IND" && (age == "SSR" || age == "SR") && bpinc == 0) {
                isSrNoBP = true;
            }

            if (bp44ad > bpinc) {
                bp44ad = bpinc;
            }

            if (bp44ad > normalinc) {
                bp44ad = normalinc;
            }

            //calculation of deductions
            //80c
            ded80c = coalesce(js.ded80c);
            if (ded80c > 150000) {
                ded80c = 150000;
            }

            if (cStatus != "IND" && cStatus != "HUF") {
                ded80c = 0;
            }

            if (oldnewslab == "new") {
                ded80c = 0;
            }

            //80ccc
            ded80ccc = coalesce(js.ded80ccc);
            if (ded80ccc > 150000) {
                ded80ccc = 150000;
            }

            if (cStatus != "IND") {
                ded80ccc = 0;
            }

            if (oldnewslab == "new") {
                ded80ccc = 0;
            }

            //80ccd1
            ded80ccd1 = coalesce(js.ded80ccd1);
            if (ded80ccd1 > 150000) {
                ded80ccd1 = 150000;
            }

            if (cStatus != "IND") {
                ded80ccd1 = 0;
            }

            if (oldnewslab == "new") {
                ded80ccd1 = 0;
            }

            if (coalesce(js.slinc) <= 0 && ded80ccd1 > parseInt((gti * 20) / 100, 0) && gti > 0) {
                ded80ccd1 = parseInt((gti * 20) / 100, 0);
            }

            //total of ded80c + ded80ccc + ded80ccd1 cannot be more than 150000
            var t80c = ded80c + ded80ccc + ded80ccd1;
            if (t80c > 150000) {
                t80c = 150000;
            }

            //80ccd1b
            ded80ccd1b = coalesce(js.ded80ccd1b);
            if (cStatus != "IND") {
                ded80ccd1b = 0;
            }

            if (ded80ccd1b > 50000) {
                ded80ccd1b = 50000;
            }

            if (oldnewslab == "new") {
                ded80ccd1b = 0;
            }

            //214(1)
            ded124_4 = coalesce(js.ded124_4);
            if (cStatus != "IND") {
                ded124_4 = 0;
            }

            if (ded124_4 > 50000) {
                ded124_4 = 50000;
            }

            if (oldnewslab == "new") {
                ded124_4 = 0;
            }

            //80ccd2
            ded80ccd2 = coalesce(js.ded80ccd2);
            if (cStatus != "IND") {
                ded80ccd2 = 0;
            }

            if (coalesce(js.slinc) <= 0) {
                ded80ccd2 = 0;
            }

            //ded80ctotal
            ded80ctotal = t80c + ded80ccd1b + ded124_4 + ded80ccd2;
            if ((ded80ctotal > gti) && (gti >= 0)) {
                ded80ctotal = gti;
            }
            js.ded80ctotal = ded80ctotal;

            //80d
            ded80d = coalesce(js.ded80d);
            if (cStatus == "IND" && ded80d > 100000) {
                ded80d = 100000;
            } else if (cStatus == "HUF" && ded80d > 50000) {
                ded80d = 50000;
            } else if (cStatus != "IND" && cStatus != "HUF") {
                ded80d = 0;
            }

            if (oldnewslab == "new") {
                ded80d = 0;
            }

            //80e
            ded80e = coalesce(js.ded80e);
            if (cStatus != "IND") {
                ded80e = 0;
            }

            if (oldnewslab == "new") {
                ded80e = 0;
            }

            //80ee
            ded80ee = coalesce(js.ded80ee);
            if (cStatus != "IND") {
                ded80ee = 0;
            }

            if (oldnewslab == "new") {
                ded80ee = 0;
            }

            if (ded80ee > 50000) {
                ded80ee = 50000;
            }

            //80tta
            ded80tta = coalesce(js.ded80tta);
            if (cStatus != "IND" && cStatus != "HUF") {
                ded80tta = 0;
            }

            if (ded80tta > 10000 && age == "NM") {
                ded80tta = 10000;
            }

            if (ded80tta > osinc) {
                ded80tta = osinc;
            }

            if (ded80tta > coalesce(js.ossaving)) {
                ded80tta = coalesce(js.ossaving);
            }

            if ((ded80tta > gti) && (gti >= 0)) {
                ded80tta = gti;
            }

            if (ded80tta > 50000 && (age == "SSR" || age == "SR") && assYr >= '2026') {
                ded80tta = 50000;
            }

            if (oldnewslab == "new") {
                ded80tta = 0;
            }

            if (assYr <= '2026') {
                if (age != "NM" && rstatus != "NR") {
                    ded80tta = 0;
                }
            }

            //80ttb
            ded80ttb = coalesce(js.ded80ttb);
            ded80P = coalesce(js.ded80P);
            if (cStatus != "IND") {
                ded80ttb = 0;
            }

            if (oldnewslab == "new" || rstatus == "NR" || age == "NM") {
                ded80ttb = 0;
            }

            if (ded80ttb > 50000) {
                ded80ttb = 50000;
            }

            if (framework == "calculator") {
                if (ded80ttb > (coalesce(js.ossaving) + coalesce(js.deposites_interest))) {
                    ded80ttb = coalesce(js.ossaving) + coalesce(js.deposites_interest);
                }
            }
            else {
                if (ded80ttb > (coalesce(js.ossaving) + coalesce(js.osintnosec))) {
                    ded80ttb = coalesce(js.ossaving) + coalesce(js.osintnosec);
                }
            }

            if ((ded80ttb > gti) && (gti >= 0)) {
                ded80ttb = gti;
            }

            if (ded80ttb > osinc) {
                ded80ttb = osinc;
            }

            //other deduction no restriction on these deduction
            othded = parseInt('0', 10);
            if (js.dedlist != undefined && js.dedlist != null) {
                $.each(js.dedlist, function (k, data) {
                    othded = othded + parseInt(coalesce(data.dedamount));
                });
            }

            if (oldnewslab == "new") {
                othded = 0;
            }

            if ((othded > gti) && (gti >= 0)) {
                othded = gti;
            }

            //total of all deduction to calculate 80G           
            var TCDCAMA = ded80ctotal + ded80d + ded80e + ded80ee + ded80tta + ded80ttb + othded + ded80P;
            if (assYr > '2026') {
                TCDCAMA = TCDCAMA - ded80ttb; // need to check with BA
            }

            if ((TCDCAMA > gti) && (gti >= 0)) {
                TCDCAMA = gti;
            }

            //80G
            ded80g = coalesce(js.ded80g);
            if (oldnewslab == "new") {
                ded80g = 0;
            }
            var adjgti = 0;
            //if (cStatus == "IND" || cStatus == "HUF" || cStatus == "FIRM") {
            if (ded80g > 0) {
                adjgti = coalesce(js.slinc) + coalesce(hpinc) + coalesce(js.bpinc) + coalesce(js.osinc) + coalesce(js.stnm) + coalesce(js.dinm) - TCDCAMA;
                if (adjgti < 0) {
                    adjgti = 0;
                }
            }

            //80g cannot be more than 10% of adjusted gti
            if (ded80g > parseInt((adjgti * 10) / 100, 10)) {
                ded80g = parseInt((adjgti * 10) / 100, 10);
            }
            //else
            //    ded80g = 0; //will be removed

            TCDCAMA = TCDCAMA + ded80g;

            if (TCDCAMA > normalinc) {
                TCDCAMA = normalinc;
            }

            //total deduction
            js.dedtotal = TCDCAMA;

            //total income after deduction
            totalti = gti - TCDCAMA;

            //normal income
            normalinc = normalinc - TCDCAMA;

            js.totalti = totalti;

            //special rate income
            spinc = st15a + lt20 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable60115BBE + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + lt112A_12T;
            tinc = normalinc + st15a + lt20 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable60115BBE + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + lt112A_12T;

            //distribution of loss setoff and deduction in all period wise special rate income
            //short term @15% income
            var diff = 0;
            if (st15a != (st15A1 + st15A2 + st15A3 + st15A4 + st15A5)) {
                diff = (st15A1 + st15A2 + st15A3 + st15A4 + st15A5) - st15a;
                if (st15A1 > diff) {
                    st15A1 = st15A1 - diff;
                    diff = 0
                }
                else {
                    diff = diff - st15A1;
                    st15A1 = 0;
                }

                if (st15A2 > diff) {
                    st15A2 = st15A2 - diff;
                    diff = 0
                }
                else {
                    diff = diff - st15A2;
                    st15A2 = 0;
                }

                if (st15A3 > diff) {
                    st15A3 = st15A3 - diff;
                    diff = 0
                }
                else {
                    diff = diff - st15A3;
                    st15A3 = 0;
                }

                if (st15A4 > diff) {
                    st15A4 = st15A4 - diff;
                    diff = 0
                }
                else {
                    diff = diff - st15A4;
                    st15A4 = 0;
                }

                if (st15A5 > diff) {
                    st15A5 = st15A5 - diff;
                    diff = 0
                }
                else {
                    diff = diff - st15A5;
                    st15A5 = 0;
                }
            }

            //long term @20% income
            diff = 0;
            if (lt20 != (lt201 + lt202 + lt203 + lt204 + lt205)) {
                diff = (lt201 + lt202 + lt203 + lt204 + lt205) - lt20;
                if (lt201 > diff) {
                    lt201 = lt201 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt201;
                    lt201 = 0;
                }

                if (lt202 > diff) {
                    lt202 = lt202 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt202;
                    lt202 = 0;
                }

                if (lt203 > diff) {
                    lt203 = lt203 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt203;
                    lt203 = 0;
                }

                if (lt204 > diff) {
                    lt204 = lt204 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt204;
                    lt204 = 0;
                }

                if (lt205 > diff) {
                    lt205 = lt205 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt205;
                    lt205 = 0;
                }
            }
            //short term @20% income
            diff = 0;
            if (lt30 != (lt301 + lt302 + lt303 + lt304 + lt305)) {
                diff = (lt301 + lt302 + lt303 + lt304 + lt305) - lt30;
                if (lt301 > diff) {
                    lt301 = lt301 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt301;
                    lt301 = 0;
                }

                if (lt302 > diff) {
                    lt302 = lt302 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt302;
                    lt302 = 0;
                }

                if (lt303 > diff) {
                    lt303 = lt303 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt303;
                    lt303 = 0;
                }

                if (lt304 > diff) {
                    lt304 = lt304 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt304;
                    lt304 = 0;
                }

                if (lt305 > diff) {
                    lt305 = lt305 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt305;
                    lt305 = 0;
                }
            }
            //short term @30% income
            diff = 0;
            if (lt40 != (lt401 + lt402 + lt403 + lt404 + lt405)) {
                diff = (lt401 + lt402 + lt403 + lt404 + lt405) - lt40;
                if (lt401 > diff) {
                    lt401 = lt401 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt401;
                    lt401 = 0;
                }

                if (lt402 > diff) {
                    lt402 = lt402 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt402;
                    lt402 = 0;
                }

                if (lt403 > diff) {
                    lt403 = lt403 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt403;
                    lt403 = 0;
                }

                if (lt404 > diff) {
                    lt404 = lt404 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt404;
                    lt404 = 0;
                }

                if (lt405 > diff) {
                    lt405 = lt405 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt405;
                    lt405 = 0;
                }
            }
            //long term @10% income
            diff = 0;
            if (lt10 != (lt101 + lt102 + lt103 + lt104 + lt105)) {
                diff = (lt101 + lt102 + lt103 + lt104 + lt105) - lt10;
                if (lt101 > diff) {
                    lt101 = lt101 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt101;
                    lt101 = 0;
                }

                if (lt102 > diff) {
                    lt102 = lt102 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt102;
                    lt102 = 0;
                }

                if (lt103 > diff) {
                    lt103 = lt103 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt103;
                    lt103 = 0;
                }

                if (lt104 > diff) {
                    lt104 = lt104 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt104;
                    lt104 = 0;
                }

                if (lt105 > diff) {
                    lt105 = lt105 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt105;
                    lt105 = 0;
                }
            }

            //long term @10% income (u/s 112A)
            diff = 0;
            if (lt11210 != (lt112101 + lt112102 + lt112103 + lt112104 + lt112105)) {
                diff = (lt112101 + lt112102 + lt112103 + lt112104 + lt112105) - lt11210;
                if (lt112101 > diff) {
                    lt112101 = lt112101 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112101;
                    lt112101 = 0;
                }

                if (lt112102 > diff) {
                    lt112102 = lt112102 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112102;
                    lt112102 = 0;
                }

                if (lt112103 > diff) {
                    lt112103 = lt112103 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112103;
                    lt112103 = 0;
                }

                if (lt112104 > diff) {
                    lt112104 = lt112104 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112104;
                    lt112104 = 0;
                }

                if (lt112105 > diff) {
                    lt112105 = lt112105 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112105;
                    lt112105 = 0;
                }
            }
            //long term @12.5% income (u/s 112A)
            diff = 0;
            if (lt11211 != (lt112111 + lt112112 + lt112113 + lt112114 + lt112115)) {
                diff = (lt112111 + lt112112 + lt112113 + lt112114 + lt112115) - lt11211;
                if (lt112111 > diff) {
                    lt112111 = lt112111 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112111;
                    lt112111 = 0;
                }

                if (lt112112 > diff) {
                    lt112112 = lt112112 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112112;
                    lt112112 = 0;
                }

                if (lt112113 > diff) {
                    lt112113 = lt112113 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112113;
                    lt112113 = 0;
                }

                if (lt112114 > diff) {
                    lt112114 = lt112114 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112114;
                    lt112114 = 0;
                }

                if (lt112115 > diff) {
                    lt112115 = lt112115 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112115;
                    lt112115 = 0;
                }
            }
            //long term @10% income (by FII) 
            diff = 0;
            if (lt11310 != (lt113101 + lt113102 + lt113103 + lt113104 + lt113105)) {
                diff = (lt113101 + lt113102 + lt113103 + lt113104 + lt113105) - lt11310;
                if (lt113101 > diff) {
                    lt113101 = lt113101 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt113101;
                    lt113101 = 0;
                }

                if (lt113102 > diff) {
                    lt113102 = lt113102 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt113102;
                    lt113102 = 0;
                }

                if (lt113103 > diff) {
                    lt113103 = lt113103 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt113103;
                    lt113103 = 0;
                }

                if (lt113104 > diff) {
                    lt113104 = lt113104 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt113104;
                    lt113104 = 0;
                }

                if (lt113105 > diff) {
                    lt113105 = lt113105 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt113105;
                    lt113105 = 0;
                }
            }
            //long term @12.5% income (by FII covered u/s 115AD- Securities covered under other than covered u/s 112A) 
            diff = 0;
            if (lt112A_12T != (lt112A_12T1 + lt112A_12T2 + lt112A_12T3 + lt112A_12T4 + lt112A_12T5)) {
                diff = (lt112A_12T1 + lt112A_12T2 + lt112A_12T3 + lt112A_12T4 + lt112A_12T5) - lt112A_12T;
                if (lt112A_12T1 > diff) {
                    lt112A_12T1 = lt112A_12T1 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112A_12T1;
                    lt112A_12T1 = 0;
                }

                if (lt112A_12T2 > diff) {
                    lt112A_12T2 = lt112A_12T2 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112A_12T2;
                    lt112A_12T2 = 0;
                }

                if (lt112A_12T3 > diff) {
                    lt112A_12T3 = lt112A_12T3 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112A_12T3;
                    lt112A_12T3 = 0;
                }

                if (lt112A_12T4 > diff) {
                    lt112A_12T4 = lt112A_12T4 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112A_12T4;
                    lt112A_12T4 = 0;
                }

                if (lt112A_12T5 > diff) {
                    lt112A_12T5 = lt112A_12T5 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt112A_12T5;
                    lt112A_12T5 = 0;
                }
            }
            //long term @12.5% income (OTHER THAN 112A) 
            diff = 0;
            if (lt11410 != (lt114101 + lt114102 + lt114103 + lt114104 + lt114105)) {
                diff = (lt114101 + lt114102 + lt114103 + lt114104 + lt114105) - lt11410;
                if (lt114101 > diff) {
                    lt114101 = lt114101 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt114101;
                    lt114101 = 0;
                }

                if (lt114102 > diff) {
                    lt114102 = lt114102 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt114102;
                    lt114102 = 0;
                }

                if (lt114103 > diff) {
                    lt114103 = lt114103 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt114103;
                    lt114103 = 0;
                }

                if (lt114104 > diff) {
                    lt114104 = lt114104 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt114104;
                    lt114104 = 0;
                }

                if (lt114105 > diff) {
                    lt114105 = lt114105 - diff;
                    diff = 0
                }
                else {
                    diff = diff - lt114105;
                    lt114105 = 0;
                }
            }

            //calculate slab limit exemption
            if (oldnewslab == "new" || rstatus == "NR" || cStatus == "HUF") {
                slablimit = TaxLimit(assYr, cStatus, age, rstatus, oldnewslab);
            } else if (cStatus == "IND" || cStatus == "HUF" || cStatus == "AOP") {
                slablimit = TaxLimit(assYr, cStatus, age, rstatus);
            }

            slablimitorg = slablimit;

            ////calculate Tax on 1 crore income for calculating marginal relief for surcharge
            var tcmntaxsur = TCMNSUTX(cStatus, rstatus, slablimit, tinc, lt20, st15a, lt10, lt40, lt30, normalinc, oldnewslab, lt11210, lt11211, lt11310, lt11410, dividend_taxable10per, dividend_taxable_115aca, dividend_taxable20, dividend_taxable_115ad, dividend_taxable_10_210_N, dividend_taxable_10_208_N, online_games_115bbj, lotteryinc, interest_taxable5per_6a, interest_taxable_5_115A, interest_taxable_4_Proviso, interest_taxable_9_6b_N, interest_taxable_10_115AC, interest_Taxable_20115A_115E, interest_Taxable_20_115AD, interest_Taxable_10_210_6e_N, interest_Taxable_10_208_6f_N, income_chargeable60115BBE, income_chargeable115BBF_10, income_chargeable115BBG_10, income_chargeable115BBA, income_from_royalty10, lt112A_12T);


            //short term normal rate income
            if (stnm > normalinc) {
                stnm = normalinc;
            }

            if (normalinc >= slablimit) {
                if ((normalinc - stnm) < slablimit) {
                    stnm = stnm - (slablimit - (normalinc - stnm));
                }
            }
            else if (normalinc <= slablimit) {
                stnm = 0;
            }

            diff = 0;
            if (stnm != (stnm1 + stnm2 + stnm3 + stnm4 + stnm5)) {
                diff = (stnm1 + stnm2 + stnm3 + stnm4 + stnm5) - stnm;
                if (stnm1 > diff) {
                    stnm1 = stnm1 - diff;
                    diff = 0
                }
                else {
                    diff = diff - stnm1;
                    stnm1 = 0;
                }

                if (stnm2 > diff) {
                    stnm2 = stnm2 - diff;
                    diff = 0
                }
                else {
                    diff = diff - stnm2;
                    stnm2 = 0;
                }

                if (stnm3 > diff) {
                    stnm3 = stnm3 - diff;
                    diff = 0
                }
                else {
                    diff = diff - stnm3;
                    stnm3 = 0;
                }

                if (stnm4 > diff) {
                    stnm4 = stnm4 - diff;
                    diff = 0
                }
                else {
                    diff = diff - stnm4;
                    stnm4 = 0;
                }

                if (stnm5 > diff) {
                    stnm5 = stnm5 - diff;
                    diff = 0
                }
                else {
                    diff = diff - stnm5;
                    stnm5 = 0;
                }
            }

            //Dividend income Taxable at Normal rates
            if (dinm > normalinc) {
                dinm = normalinc;
            }

            if (normalinc >= slablimit) {
                if ((normalinc - dinm) < slablimit) {
                    dinm = dinm - (slablimit - (normalinc - dinm));
                }
            }
            else if (normalinc <= slablimit) {
                dinm = 0;
            }

            diff = 0;
            if (dinm != (dinm1 + dinm2 + dinm3 + dinm4 + dinm5)) {
                diff = (dinm1 + dinm2 + dinm3 + dinm4 + dinm5) - dinm;
                if (dinm1 > diff) {
                    dinm1 = dinm1 - diff;
                    diff = 0
                }
                else {
                    diff = diff - dinm1;
                    dinm1 = 0;
                }

                if (dinm2 > diff) {
                    dinm2 = dinm2 - diff;
                    diff = 0
                }
                else {
                    diff = diff - dinm2;
                    dinm2 = 0;
                }

                if (dinm3 > diff) {
                    dinm3 = dinm3 - diff;
                    diff = 0
                }
                else {
                    diff = diff - dinm3;
                    dinm3 = 0;
                }

                if (dinm4 > diff) {
                    dinm4 = dinm4 - diff;
                    diff = 0
                }
                else {
                    diff = diff - dinm4;
                    dinm4 = 0;
                }

                if (dinm5 > diff) {
                    dinm5 = dinm5 - diff;
                    diff = 0
                }
                else {
                    diff = diff - dinm5;
                    dinm5 = 0;
                }
            }


            surc = 0;

            cg112and111A = st15a + lt30 + lt40 + lt20 + lt11210 + lt11211 + lt11310 + lt112A_12T + lt11410;

            //calculation for tax on narmal income and special rate income
            //individula and HUF
            if (cStatus == "IND" || cStatus == "HUF") {
                slablimitorg = slablimit;

                if (oldnewslab == "old") {
                    //tax on normal rate income
                    TaxNormal = TaxIndOld(slablimit, normalinc);
                    //tax without 44ad income
                    TAXWO44AD = TaxIndOld(slablimit, normalinc - bp44ad);
                }
                else {
                    TaxNormal = TaxIndNew(slablimit, normalinc);
                    TAXWO44AD = TaxIndNew(slablimit, normalinc - bp44ad);
                }

                //In case where status is Non Resident, the special rate incomes are not shifted to basic exemption limit.
                if (rstatus == "NR") {
                    slablimit = 0;
                }

                //special rate income
                tstax = GetTaxSp(spinc, normalinc, slablimit, false);

                //tax befor rebate 87A
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt30tax + lt40tax + lt11210tax + lt11310tax + lt11410tax + lt11211tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;

                //New Tax Regime-AY 2026-27-Rebate u/s 87A - (Special rebate)
                if (assYr >= '2026' && oldnewslab == 'new') {
                    //Rebate u/s 87A
                    rebate87a = RebateCalculation(normalinc, TaxNormal, oldnewslab, assYr, rstatus, cStatus, age);
                    if (((rstatus == "NR") && (cStatus == "IND")) || (cStatus == "HUF")) {
                        rebate87a = 0;
                    } else {
                        rebate87a = 60000;
                        if (normalinc > 1200000) {
                            let diff = normalinc - 1200000;
                            if (TaxNormal > diff) {
                                rebate87a = TaxNormal - diff;
                            } else {
                                rebate87a = 0;
                            }
                        }
                        if (rebate87a > TaxNormal) {
                            rebate87a = TaxNormal;
                        }
                    }
                } else if (assYr >= '2024' && oldnewslab == 'new') {
                    //New Tax Regime-AY 2024-25-Rebate u/s 87A - (Special rebate)
                    //Rebate u/s 87A
                    rebate87a = RebateCalculation(normalinc, TaxNormal, oldnewslab, assYr, rstatus, cStatus, age);
                    if (((rstatus == "NR") && (cStatus == "IND")) || (cStatus == "HUF")) {
                        rebate87a = 0;
                    } else {
                        rebate87a = 25000;
                        if (normalinc > 700000) {
                            let diff = normalinc - 700000;
                            if (TaxNormal > diff) {
                                rebate87a = TaxNormal - diff;
                            } else {
                                rebate87a = 0;
                            }
                        }
                        if (rebate87a > TaxNormal) {
                            rebate87a = TaxNormal;
                        }
                    }
                } else {
                    //Rebate u/s 87A
                    rebate87a = RebateCalculation(tinc, TaxBfrRebate, oldnewslab, assYr, rstatus, cStatus, age);
                    if (rebate87a > (TaxBfrRebate - lt11210tax - lt11211tax)) {
                        rebate87a = TaxBfrRebate - lt11210tax - lt11211tax;
                    }
                }

                //Tax after rebate u/s 87A
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);

                //surcharge calculation
                surc = MNSUTX(tinc, TaxAftrRebate, tcmntaxsur, assYr, cStatus, spinc, normalinc, TaxNormal, dividend115_AD_20tax, dividend210_10tax);
            }
            else if (cStatus == "AOP")  //aop/boi
            {
                slablimitorg = slablimit;
                if (oldnewslab == "old") {
                    TaxNormal = TaxIndOld(slablimit, normalinc);
                    TAXWO44AD = TaxIndOld(slablimit, normalinc - bp44ad);
                } else {
                    TaxNormal = TaxIndNew(slablimit, normalinc);
                    TAXWO44AD = TaxIndNew(slablimit, normalinc - bp44ad);
                }
                if (rstatus == "NR") {
                    slablimit = 0;
                }

                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                rebate87a = 0;
                TaxBfrRebate = TaxNormal + lt20tax + lt30tax + lt40tax + lt11211tax + lt11310tax + lt11210tax + lt11410tax + st15tax + lt10tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);
                surc = MNSUTX(tinc, TaxAftrRebate, tcmntaxsur, assYr, cStatus, spinc, normalinc, TaxNormal, dividend115_AD_20tax, dividend210_10tax);
            }
            else if (cStatus == "FIRM" || cStatus == "LLP") {
                slablimit = 0;
                slablimitorg = 0;
                TaxNormal = parseInt((normalinc) * 0.30);

                if (cStatus == "LLP") {
                    TAXWO44AD = TaxNormal;
                } else {
                    TAXWO44AD = parseInt((normalinc - bp44ad) * 0.30);
                }

                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt11210tax + lt30tax + lt40tax + lt11310tax + lt11410tax + lt11211tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);

                if (tinc >= 10000000) {
                    surc = parseInt(TaxAftrRebate * 0.12);
                }
                if (income_chargeable60115BBEtax > 0) {
                    surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
                }

                if (tinc > 10000000 && tinc < 10650000) {
                    // var TCSURCMG = (tinc - 10000000) - (TaxAftrRebate - tcmntaxsur);
                    var TCSURCMG = 0;
                    var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                    TCSURCMG = sumoftaxandSur - ((tinc - 10000000) + tcmntaxsur);
                    TCSURCMG = surc - TCSURCMG;
                    if (TCSURCMG < surc) {
                        surc = TCSURCMG;
                    }
                }
            }
            else if (cStatus == "COMPD") {
                //company domestic
                slablimit = 0;
                slablimitorg = 0;
                TaxNormal = parseInt((normalinc) * 0.30);

                TAXWO44AD = TaxNormal;

                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt30tax + lt40tax + lt11210tax + lt11211tax + lt11310tax + lt11410tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);

                if (oldnewslab == "new") {
                    surc = parseInt(TaxAftrRebate * 0.10);
                } else if (tinc > 10000000 && tinc <= 100000000) {
                    surc = parseInt(TaxAftrRebate * 0.07);
                } else if (tinc > 100000000) {
                    surc = parseInt(TaxAftrRebate * 0.12);
                }
                if (income_chargeable60115BBEtax > 0) {
                    surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
                }

                if (tinc > 100000000 && tinc < 102300000) {
                    // var TCSURCMG = (tinc - 100000000) - (TaxAftrRebate - tcmntaxsur);
                    var TCSURCMG = 0;
                    var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                    TCSURCMG = sumoftaxandSur - ((tinc - 100000000) + tcmntaxsur);
                    TCSURCMG = surc - TCSURCMG;
                    if (TCSURCMG < surc) {
                        surc = TCSURCMG;
                    }
                }
                else if (tinc > 10000000 && tinc < 10450000) {
                    // var TCSURCMG = (tinc - 10000000) - (TaxAftrRebate - tcmntaxsur);
                    var TCSURCMG = 0;
                    var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                    TCSURCMG = sumoftaxandSur - ((tinc - 10000000) + tcmntaxsur);
                    TCSURCMG = surc - TCSURCMG;
                    if (TCSURCMG < surc) {
                        surc = TCSURCMG;
                    }
                }
            }
            else if (cStatus == "COMPF") {
                //company foreign
                slablimit = 0;
                slablimitorg = 0;
                if (parseInt(assYr) >= 2025) {
                    TaxNormal = parseInt((normalinc) * 0.35);
                } else {
                    TaxNormal = parseInt((normalinc) * 0.40);
                }

                TAXWO44AD = TaxNormal;

                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt11210tax + lt40tax + lt30tax + lt11211tax + lt11310tax + lt11410tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);

                if (tinc > 10000000 && tinc <= 100000000) {
                    surc = parseInt(TaxAftrRebate * 0.02);
                } else if (tinc > 100000000) {
                    surc = parseInt(TaxAftrRebate * 0.05);
                }
                if (income_chargeable60115BBEtax > 0) {
                    surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
                }

                if (tinc > 100000000 && tinc < 102300000) {
                    // var TCSURCMG = (tinc - 100000000) - (TaxAftrRebate - tcmntaxsur);
                    var TCSURCMG = 0;
                    var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                    TCSURCMG = sumoftaxandSur - ((tinc - 100000000) + tcmntaxsur);
                    TCSURCMG = surc - TCSURCMG;
                    if (TCSURCMG < surc) {
                        surc = TCSURCMG;
                    }
                }
                else if (tinc > 10000000 && tinc < 10450000) {
                    // var TCSURCMG = (tinc - 10000000) - (TaxAftrRebate - tcmntaxsur);
                    var TCSURCMG = 0;
                    var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                    TCSURCMG = sumoftaxandSur - ((tinc - 10000000) + tcmntaxsur);
                    TCSURCMG = surc - TCSURCMG;
                    if (TCSURCMG < surc) {
                        surc = TCSURCMG;
                    }
                }
            }
            else if (cStatus == "TRUST") {
                slablimit = 0;
                slablimitorg = 0;
                TaxNormal = parseInt((normalinc) * 0.30);

                TAXWO44AD = TaxNormal;

                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt11210tax + lt40tax + lt30tax + lt11211tax + lt11310tax + lt11410tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);
                // if (cg112and111ATax > 0) {
                //     if ((TaxAftrRebate - cg112and111ATax) > 0) {
                //         surc = parseInt((TaxAftrRebate - cg112and111ATax) * 0.37) + parseInt(cg112and111ATax * 0.15);
                //     } else {
                //         surc = parseInt(cg112and111ATax * 0.15);
                //     }
                // }
                // else {
                surc = parseInt(TaxAftrRebate * 0.37);
                // }
                if (income_chargeable60115BBEtax > 0) {
                    surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
                }
            }
            else if (cStatus == "COOP") {
                //Cooperative societies not opting for 115BAD/115BAE
                slablimit = 0;
                slablimitorg = 0;
                TaxNormal = TaxCoop(normalinc);
                TAXWO44AD = TaxNormal;
                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt11210tax + lt40tax + lt30tax + lt11211tax + lt11310tax + lt11410tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);

                if (parseInt(assYr) >= 2025) {
                    surc = MNSUTX(tinc, TaxAftrRebate, tcmntaxsur, assYr, cStatus, spinc, normalinc, TaxNormal, dividend115_AD_20tax, dividend210_10tax); // need to check with BA 
                } else {
                    if (oldnewslab == "new") {
                        surc = parseInt(TaxAftrRebate * 0.10);
                    } else if (tinc > 10000000 && tinc <= 100000000) {
                        surc = parseInt(TaxAftrRebate * 0.07);
                    } else if (tinc > 100000000) {
                        surc = parseInt(TaxAftrRebate * 0.12);
                    }
                    if (income_chargeable60115BBEtax > 0) {
                        surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
                    }

                    if (oldnewslab != "new" && tinc > 10000000 && tinc < 10650000) {
                        // var TCSURCMG = (tinc - 10000000) - (TaxAftrRebate - tcmntaxsur);
                        var TCSURCMG = 0;
                        var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                        TCSURCMG = sumoftaxandSur - ((tinc - 10000000) + tcmntaxsur);
                        TCSURCMG = surc - TCSURCMG;
                        if (TCSURCMG < surc) {
                            surc = TCSURCMG;
                        }
                    }
                }
            } else if (cStatus == "COOP115BAD") {
                //Cooperative society opting for 115BAD
                slablimit = 0;
                slablimitorg = 0;
                TaxNormal = parseInt((normalinc) * 0.22);
                TAXWO44AD = TaxNormal;
                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt11210tax + lt40tax + lt30tax + lt11211tax + lt11310tax + lt11410tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);
                surc = parseInt(TaxAftrRebate * 0.10);
                if (income_chargeable60115BBEtax > 0) {
                    surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
                }

                if (oldnewslab != "new" && tinc > 10000000 && tinc < 10650000) {
                    // var TCSURCMG = (tinc - 10000000) - (TaxAftrRebate - tcmntaxsur);
                    var TCSURCMG = 0;
                    var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                    TCSURCMG = sumoftaxandSur - ((tinc - 10000000) + tcmntaxsur);
                    TCSURCMG = surc - TCSURCMG;
                    if (TCSURCMG < surc) {
                        surc = TCSURCMG;
                    }
                }
            } else if (cStatus == "COOP115BAE") {
                //Eligible manufacturing Cooperative society opting for 115BAE
                slablimit = 0;
                slablimitorg = 0;
                var TaxNormalIncManu = 0;
                if (incomeManuf_Busnss > 0) {
                    TaxNormalIncManu = parseInt((incomeManuf_Busnss) * 0.15);
                }
                TaxNormal = parseInt((normalinc) * 0.22);
                TaxNormal = TaxNormal + TaxNormalIncManu;
                TAXWO44AD = TaxNormal;
                tstax = GetTaxSp(spinc, normalinc, slablimit, false);
                TaxBfrRebate = TaxNormal + lt20tax + st15tax + lt10tax + lt11210tax + lt40tax + lt30tax + lt11211tax + lt11310tax + lt11410tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + recognised_provident_fund_taxable_6jtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + lt112A_12Ttax;
                rebate87a = 0;
                // TaxAftrRebate = TaxBfrRebate - rebate87a;
                TaxAftrRebate = TaxBfrRebate - (rebate87a + income_chargeable60115BBEtax);
                surc = parseInt(TaxAftrRebate * 0.10);
                if (income_chargeable60115BBEtax > 0) {
                    surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
                }

                if (oldnewslab != "new" && tinc > 10000000 && tinc < 10650000) {
                    // var TCSURCMG = (tinc - 10000000) - (TaxAftrRebate - tcmntaxsur);
                    var TCSURCMG = 0;
                    var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
                    TCSURCMG = sumoftaxandSur - ((tinc - 10000000) + tcmntaxsur);
                    TCSURCMG = surc - TCSURCMG;
                    if (TCSURCMG < surc) {
                        surc = TCSURCMG;
                    }
                }
            }

            //update final calculated value back to json object 
            js.taxnm = TaxNormal;
            js.taxsp = tstax;
            js.taxst15A = st15tax;
            js.taxlt20 = lt20tax;
            js.taxlt40 = lt40tax;
            js.taxdividend115AC10 = dividend115AC10tax;
            js.taxdividend115ACA_10 = dividend115ACA_10tax;
            js.taxdividend115A_20 = dividend115A_20tax;
            js.taxdividend_115AD_20 = dividend115_AD_20tax;
            js.taxdividend210_10 = dividend210_10tax;
            js.taxdividend208_10 = dividend208_10tax;
            js.income_winningsonline_games = onlineGame115BBJtax;
            js.interest_taxable5 = interest_taxable5tax;
            js.interest_taxable_5_115A = interest_taxable_5_115Atax;
            js.interest_taxable_4_Proviso = interest_taxable_4_115APtax;
            js.interest_taxable_9_6b_N = interest_taxable_9_6b_Ntax;
            js.interest_taxable_10_115AC = interest_taxable_10_115ACtax;
            js.interest_Taxable_20115A_115E = interest_Taxable_20115A_115Etax;
            js.interest_Taxable_20_115AD = interest_Taxable_20_115ADtax;
            js.interest_Taxable_10_210_6e_N = interest_Taxable_10_210_6e_Ntax;
            js.interest_Taxable_10_208_6f_N = interest_Taxable_10_208_6f_Ntax;
            js.income_chargeable60115BBE = income_chargeable60115BBEtax;
            js.income_chargeable115BBF_10 = income_chargeable115BBF_10tax;
            js.income_chargeable115BBG_10 = income_chargeable115BBG_10tax;
            js.income_chargeable115BBA = income_chargeable115BBAtax;
            js.income_from_royalty10 = income_from_royalty10tax;
            js.taxlt30 = lt30tax;
            js.taxlt10 = lt10tax;
            js.taxlt11210 = lt11210tax;
            js.taxlt11211 = lt11211tax;
            js.taxlt11310 = lt11310tax;
            js.taxlt112A_12T = lt112A_12Ttax;
            js.taxlt11410 = lt11410tax;
            js.taxlottery = lotteryTax;
            js.GrossTax = TaxBfrRebate;
            js.rebate87A = rebate87a;
            js.TaxAftr87A = TaxAftrRebate + income_chargeable60115BBEtax;

            if (surc < 0) {
                surc = 0;
            }

            // if (income_chargeable60115BBEtax > 0) {
            //     surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
            // }

            js.Surcharge = parseInt(surc, 10);
            ecess = parseInt((TaxAftrRebate + income_chargeable60115BBEtax + surc) * 0.04);
            js.ECess = ecess;
            TotalTax = TaxAftrRebate + income_chargeable60115BBEtax + surc + ecess;
            js.TotalTax = TotalTax;
            TaxAftrTds = TotalTax - tds;
            //js.BalTax = TaxAftrTds;

            var TCMNTXTD = TaxAftrTds;
            var totIncWo44AD = tinc - bp44ad;
            TAXWO44AD = TAXWO44AD + lt20tax + st15tax + lt10tax + lt30tax + lt40tax + lt11310tax + lt11410tax + lt11211tax + lt11210tax + lotteryTax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + onlineGame115BBJtax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + recognised_provident_fund_taxable_6jtax + lt112A_12Ttax - rebate87a;
            if (surc > 0) {
                TAXWO44AD = TAXWO44AD + parseInt((surc * totIncWo44AD) / tinc, 10);
            }

            //Education CESS
            TAXWO44AD = TAXWO44AD + parseInt(TAXWO44AD * 0.04, 10);
            TAXWO44AD = zeroOrMore(TAXWO44AD - tds);
            TAX44AD = parseInt(zeroOrMore(TCMNTXTD - TAXWO44AD));
            slablimit = slablimitorg;
            var tdiff = 0;

            //distribute surc and cess in normal tax 
            PTAX = stnmtax + lt20tax + st15tax + lt10tax + lt11210tax + lt30tax + lt40tax + lt11310tax + lt11410tax + lt11211tax + lt112A_12Ttax;

            //intrest u/s 234A,B,C
            INT234ABC(assYr, slablimitorg, tinc, TCMNTXTD, TAX44AD, isSrNoBP, js, normalinc, slablimit, oldnewslab, js.Surcharge);
            if ((js.itrType == 'updated')) {
                if ((js.NetTax < 0)) {
                    refund = Math.abs(js.NetTax);
                    js.NetTax = 0;
                } else {
                    refund = 0;
                }
                refundCal(js);
            }
        }
    }
})();

refundCal = function (js) {
    refundClaimed = js.refundClaimed ? js.refundClaimed : 0;
    refundPayable = js.refundPayable ? js.refundPayable : 0;
    regularAssesment = js.regularAssesment ? js.regularAssesment : 0;
    aggregateLiability = js.NetTax + refundClaimed - refund - js.regularAssesment - refundPayable;
    aggregateLiability = aggregateLiability ? ((aggregateLiability < 0) ? 0 : aggregateLiability) : 0;
    if (js.fileUpdatedReturn == '12M') {
        addIncomeTaxLiability = Math.round((aggregateLiability - js.Fee234F) * 0.25);
    } else if (js.fileUpdatedReturn == '12to24M') {
        addIncomeTaxLiability = Math.round((aggregateLiability - js.Fee234F) * 0.50);
    } else if (js.fileUpdatedReturn == '24to36M') {
        addIncomeTaxLiability = Math.round((aggregateLiability - js.Fee234F) * 0.60);
    } else if (js.fileUpdatedReturn == '36to48M') {
        addIncomeTaxLiability = Math.round((aggregateLiability - js.Fee234F) * 0.70);
    }
    addIncomeTaxLiability = addIncomeTaxLiability ? ((addIncomeTaxLiability < 0) ? 0 : addIncomeTaxLiability) : 0;
    netAmountPayable = aggregateLiability + addIncomeTaxLiability;
    netAmountPayable = netAmountPayable ? ((netAmountPayable < 0) ? 0 : netAmountPayable) : 0;
    js.refund = parseInt(refund, 10);
    js.refundClaimed = parseInt(refundClaimed, 10);
    js.refundPayable = parseInt(refundPayable, 10);
    js.regularAssesment = parseInt(regularAssesment, 10);
    js.aggregateLiability = parseInt(aggregateLiability, 10);
    js.addIncomeTaxLiability = parseInt(addIncomeTaxLiability, 10);
    js.netAmountPayable = parseInt(netAmountPayable, 10);
}

//calculation of intrest 234A,B,C and F
var INT234ABC = function (assYr, slablimit, tinc, TCMNTXTD, TAX44AD, isSrNoBP, js, normalinc, slablimit, oldnewslab, Surcharge) {
    Int234A = 0;
    Int234B = 0;
    Int234C = 0;
    Int234F = 0;
    var TCMNTXTD1, TCMNTXTD2, TCMNTXTD3, TCMNTXTD4;
    TCMNTXTD1 = TCMNTXTD2 = TCMNTXTD3 = TCMNTXTD4 = 0;
    //financial year
    var fyr = parseInt(assYr) - 1;
    //Assessment year Start date
    AyStDt = '01/04/' + assYr;
    //Financial year Start date
    FyStDt = '01/04/' + fyr;
    //Financial year End date
    FyEdDt = '31/03/' + assYr;
    //Int 234 C quarter date
    var slab0_edt = '15/06/' + fyr;
    var slab1_stdt = '16/06/' + fyr;
    var slab1_edt = '15/09/' + fyr;
    var slab2_stdt = '16/09/' + fyr;
    var slab2_edt = '15/12/' + fyr;
    var slab3_stdt = '16/12/' + fyr;
    var slab3_edt = '15/03/' + assYr;
    var slab4_stdt = '16/03/' + assYr;

    var duedate = '';
    var duedate1 = '';
    var filedate = '';
    var prevItrFileDt = '';

    //Filing due date
    duedate = getDate(js.duedate);

    var parts = duedate.split('/');
    var dt = new Date(parts[2], parts[1] - 1, parts[0]);
    dt = new Date(dt.setDate(dt.getDate() + 1));
    duedate1 = getfulldate(dt.getDate(), dt.getMonth(), dt.getFullYear());

    filedate = getDate(js.filedate);
    prevItrFileDt = getDate(js.prevItrFileDt);

    //get advance Tax values
    adv1 = adv2 = adv3 = adv4 = adv5 = selftax = 0;
    selftax = 0;
    if (js.paymentdetails != undefined && js.paymentdetails != null) {
        $.each(js.paymentdetails, function (k, data) {
            dt1 = getDate(new Date(data.paydate));
            if (checkFirstDateBefore(FyStDt, dt1) && checkFirstDateBefore(dt1, slab0_edt)) {
                adv1 = adv1 + parseInt(coalesce(data.payamount), 10);
            } else if (checkFirstDateBefore(slab1_stdt, dt1) && checkFirstDateBefore(dt1, slab1_edt)) {
                adv2 = adv2 + parseInt(coalesce(data.payamount), 10);
            } else if (checkFirstDateBefore(slab2_stdt, dt1) && checkFirstDateBefore(dt1, slab2_edt)) {
                adv3 = adv3 + parseInt(coalesce(data.payamount), 10);
            } else if (checkFirstDateBefore(slab3_stdt, dt1) && checkFirstDateBefore(dt1, slab3_edt)) {
                adv4 = adv4 + parseInt(coalesce(data.payamount), 10);
            } else if (checkFirstDateBefore(slab4_stdt, dt1) && checkFirstDateBefore(dt1, FyEdDt)) {
                adv5 = adv5 + parseInt(coalesce(data.payamount), 10);
            } else {
                selftax = selftax + parseInt(coalesce(data.payamount), 10);
            }
        });
    }

    var advTax = parseInt(adv1, 10) + parseInt(adv2, 10) + parseInt(adv3, 10) + parseInt(adv4, 10) + parseInt(adv5, 10);
    var intrst234Bi, intrst234Bii;

    TCMNTXTD = TCMNTXTD - PTAX;
    var orgTCMNTXTD = TCMNTXTD;

    //234F
    if ((tinc > slablimit) && ((js.itrType != 'updated') || ((js.itrType == 'updated') && (js.fileItr != 'Y')))) {
        if (checkFirstDateBefore(filedate, duedate) == false) {
            if (tinc > 500000) {
                Int234F = 5000;
            } else {
                Int234F = 1000;
            }
        } else {
            Int234F = 0;
        }
    } else {
        Int234F = 0;
    }

    // 234C new calc 
    var normal_inc234C, Q1taxNormal, Q2taxNormal, Q3taxNormal, Q4taxNormal, Q5taxNormal, Q1taxSpecial, Q2taxSpecial, Q3taxSpecial, Q4taxSpecial, Q5taxSpecial, totalQ4Q5 = 0;
    var Q1, Q2, Q3, Q4, Q5 = 0;
    var taxApartform_BB_BBJ_E = interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + recognised_provident_fund_taxable_6jtax;
    normal_inc234C = normalinc - (bp44ad + dinm + stnm);

    if (oldnewslab == "old") {
        //tax on normal rate income
        Q1taxNormal = TaxIndOld(slablimit, normal_inc234C + stnm1 + dinm1);
        Q2taxNormal = TaxIndOld(slablimit, normal_inc234C + stnm1 + stnm2 + dinm1 + dinm2);
        Q3taxNormal = TaxIndOld(slablimit, normal_inc234C + stnm1 + stnm2 + stnm3 + dinm1 + dinm2 + dinm3);
        Q4taxNormal = TaxIndOld(slablimit, normal_inc234C + stnm1 + stnm2 + stnm3 + stnm4 + dinm1 + dinm2 + dinm3 + dinm4 + bp44ad);
        Q5taxNormal = TaxIndOld(slablimit, normal_inc234C + stnm1 + stnm2 + stnm3 + stnm4 + stnm5 + dinm1 + dinm2 + dinm3 + dinm4 + dinm5 + bp44ad) - Q4taxNormal;
    }
    else {
        Q1taxNormal = TaxIndNew(slablimit, normal_inc234C + stnm1 + dinm1);
        Q2taxNormal = TaxIndNew(slablimit, normal_inc234C + stnm1 + stnm2 + dinm1 + dinm2);
        Q3taxNormal = TaxIndNew(slablimit, normal_inc234C + stnm1 + stnm2 + stnm3 + dinm1 + dinm2 + dinm3);
        Q4taxNormal = TaxIndNew(slablimit, normal_inc234C + stnm1 + stnm2 + stnm3 + stnm4 + dinm1 + dinm2 + dinm3 + dinm4 + bp44ad);
        Q5taxNormal = TaxIndNew(slablimit, normal_inc234C + stnm1 + stnm2 + stnm3 + stnm4 + stnm5 + dinm1 + dinm2 + dinm3 + dinm4 + dinm5 + bp44ad) - Q4taxNormal;
    }

    Q1taxSpecial = lt20tx1 + st15tx1 + lt10tx1 + lt11210tx1 + lt30tx1 + lt40tx1 + lt11310tx1 + lt11410tx1 + lt11211tx1 + lotteryTx1 + onlineGame115BBJtx1 + income_chargeable60115BBEtax + taxApartform_BB_BBJ_E + dividend115AC10tx1 + dividend115ACA_10tx1 + dividend115A_20tx1 + dividend115_AD_20tx1 + dividend210_10tx1 + dividend208_10tx1 + lt112A_12T1tax;
    Q2taxSpecial = lt20tx2 + st15tx2 + lt10tx2 + lt11210tx2 + lt30tx2 + lt40tx2 + lt11310tx2 + lt11410tx2 + lt11211tx2 + lotteryTx2 + onlineGame115BBJtx2 + income_chargeable60115BBEtax + taxApartform_BB_BBJ_E + dividend115AC10tx2 + dividend115ACA_10tx2 + dividend115A_20tx2 + dividend115_AD_20tx2 + dividend210_10tx2 + dividend208_10tx2 + lt112A_12T2tax;
    Q3taxSpecial = lt20tx3 + st15tx3 + lt10tx3 + lt11210tx3 + lt30tx3 + lt40tx3 + lt11310tx3 + lt11410tx3 + lt11211tx3 + lotteryTx3 + onlineGame115BBJtx3 + income_chargeable60115BBEtax + taxApartform_BB_BBJ_E + dividend115AC10tx3 + dividend115ACA_10tx3 + dividend115A_20tx3 + dividend115_AD_20tx3 + dividend210_10tx3 + dividend208_10tx3 + lt112A_12T3tax;
    Q4taxSpecial = lt20tx4 + st15tx4 + lt10tx4 + lt11210tx4 + lt30tx4 + lt40tx4 + lt11310tx4 + lt11410tx4 + lt11211tx4 + lotteryTx4 + onlineGame115BBJtx4 + income_chargeable60115BBEtax + taxApartform_BB_BBJ_E + dividend115AC10tx4 + dividend115ACA_10tx4 + dividend115A_20tx4 + dividend115_AD_20tx4 + dividend210_10tx4 + dividend208_10tx4 + lt112A_12T4tax;
    Q5taxSpecial = lt20tx5 + st15tx5 + lt10tx5 + lt11210tx5 + lt30tx5 + lt40tx5 + lt11310tx5 + lt11410tx5 + lt11211tx5 + lotteryTx5 + onlineGame115BBJtx5 + income_chargeable60115BBEtax + taxApartform_BB_BBJ_E + dividend115AC10tx5 + dividend115ACA_10tx5 + dividend115A_20tx5 + dividend115_AD_20tx5 + dividend210_10tx5 + dividend208_10tx5 + lt112A_12T5tax - Q4taxSpecial;


    Q1 = Q1taxNormal + Q1taxSpecial - rebate87a;
    Q2 = Q2taxNormal + Q2taxSpecial - rebate87a;
    Q3 = Q3taxNormal + Q3taxSpecial - rebate87a;
    Q4 = Q4taxNormal + Q4taxSpecial - rebate87a;
    Q5 = Q5taxNormal - Q5taxSpecial - rebate87a;

    var surchar11BBE = parseInt((income_chargeable60115BBEtax) * 0.25);
    var tsurchar_req = Surcharge - surchar11BBE;

    if (Q4 + Q5 == 0) {
        totalQ4Q5 = 1;
    } else {
        totalQ4Q5 = Q4 + Q5;
    }

    var surcharQ1 = (tsurchar_req * (Q1 / (totalQ4Q5))) + surchar11BBE;
    var surcharQ2 = (tsurchar_req * (Q2 / (totalQ4Q5))) + surchar11BBE;
    var surcharQ3 = (tsurchar_req * (Q3 / (totalQ4Q5))) + surchar11BBE;
    var surcharQ4 = (tsurchar_req * (Q4 / (totalQ4Q5))) + surchar11BBE;
    var surcharQ5 = (tsurchar_req * (Q5 / (totalQ4Q5)));

    var HEDUQ1 = (Q1 + surcharQ1) * 0.04;
    var HEDUQ2 = (Q2 + surcharQ2) * 0.04;
    var HEDUQ3 = (Q3 + surcharQ3) * 0.04;
    var HEDUQ4 = (Q4 + surcharQ4) * 0.04;
    var HEDUQ5 = (Q5 + surcharQ5) * 0.04;

    var Q1TAX = Q1 + surcharQ1 + HEDUQ1 - tds;
    var Q2TAX = Q2 + surcharQ2 + HEDUQ2 - tds;
    var Q3TAX = Q3 + surcharQ3 + HEDUQ3 - tds;
    var Q4TAX = Q4 + surcharQ4 + HEDUQ4 - tds;
    var Q5TAX = Q5 + surcharQ5 + HEDUQ5;

    var PER15Q1 = parseInt((Q1TAX * 0.15), 10);
    var PER45Q2 = parseInt((Q2TAX * 0.45), 10);
    var PER75Q3 = parseInt((Q3TAX * 0.75), 10);
    var PER100Q4 = parseInt((Q4TAX * 1.00), 10);
    var PER100Q5 = Q5TAX;

    var roundfallQ1, roundfallQ2, roundfallQ3, roundfallQ4, roundfallQ5 = 0;

    if (adv1 >= parseInt(Q1TAX * 0.12)) {
        roundfallQ1 = 0;
    } else {
        roundfallQ1 = PER15Q1 - adv1;
        if (parseInt(roundfallQ1, 10) > 100) {
            roundfallQ1 = Math.floor(parseInt(roundfallQ1, 10) / 100) * parseInt('100', 10);
        }
        roundfallQ1 = parseInt(roundfallQ1, 10) * parseFloat('0.01') * parseInt('3', 10);
    }

    if ((adv1 + adv2) >= parseInt(Q2TAX * 0.36)) {
        roundfallQ2 = 0;
    } else {
        roundfallQ2 = PER45Q2 - (adv1 + adv2);
        if (parseInt(roundfallQ2, 10) > 100) {
            roundfallQ2 = Math.floor(parseInt(roundfallQ2, 10) / 100) * parseInt('100', 10);
        }
        roundfallQ2 = parseInt(roundfallQ2, 10) * parseFloat('0.01') * parseInt('3', 10);
    }

    if ((adv1 + adv2 + adv3) >= parseInt(Q3TAX * 0.75)) {
        roundfallQ3 = 0;
    } else {
        roundfallQ3 = PER75Q3 - (adv1 + adv2 + adv3);
        if (parseInt(roundfallQ3, 10) > 100) {
            roundfallQ3 = Math.floor(parseInt(roundfallQ3, 10) / 100) * parseInt('100', 10);
        }
        roundfallQ3 = parseInt(roundfallQ3, 10) * parseFloat('0.01') * parseInt('3', 10);
    }

    if ((adv1 + adv2 + adv3 + adv4) >= parseInt(Q4TAX * 1.00)) {
        roundfallQ4 = 0;
    } else {
        roundfallQ4 = PER100Q4 - (adv1 + adv2 + adv3 + adv4);
        if (parseInt(roundfallQ4, 10) > 100) {
            roundfallQ4 = Math.floor(parseInt(roundfallQ4, 10) / 100) * parseInt('100', 10);
        }
        roundfallQ4 = parseInt(roundfallQ4, 10) * parseFloat('0.01') * parseInt('1', 10);
    }

    if ((adv5) >= parseInt(Q5TAX * 1.00)) {
        roundfallQ5 = 0;
    } else {
        roundfallQ5 = PER100Q5 - (adv5);
        if (parseInt(roundfallQ5, 10) > 100) {
            roundfallQ5 = Math.floor(parseInt(roundfallQ5, 10) / 100) * parseInt('100', 10);
        }
        roundfallQ5 = parseInt(roundfallQ5, 10) * parseFloat('0.01') * parseInt('1', 10);
    }

    if ((TCMNTXTD + PTAX) > 10000 && isSrNoBP == false) {
        Int234C = roundfallQ1 + roundfallQ2 + roundfallQ3 + roundfallQ4 + roundfallQ5;
    }

    TCMNTXTD = orgTCMNTXTD;

    //234A
    var dd = parseInt(duedate.substring(0, 2), 10);
    var MonthsAfterDueDate = parseInt('0', 10);
    let itrFilingDt = prevItrFileDt ? prevItrFileDt : filedate;
    if (dd < 28) {
        if (checkFirstDateBefore(itrFilingDt, duedate) == false) {
            MonthsAfterDueDate = calcNoOfMonths(itrFilingDt, duedate);
        }
    }
    else {
        MonthsAfterDueDate = calcNoOfMonths(itrFilingDt, duedate) - 1;
    }

    //calculate 234B first part which is to be subtracted from sat paid between 01-Apr to due date.
    intrst234Bi = 0;
    intrst234Bii = 0;

    var AdvancedTax234A = calculateAdvancedTax234A(duedate, js) - parseInt(intrst234Bi, 10) - parseInt(intrst234Bii, 10) - parseInt(Int234C, 10);
    if (AdvancedTax234A < 0) AdvancedTax234A = 0;

    var intrst234Aprinciple = TCMNTXTD + PTAX - adv1 - adv2 - adv3 - adv4 - adv5 - AdvancedTax234A;
    if (intrst234Aprinciple < 0) {
        intrst234Aprinciple = parseInt('0', 10);
    } else {
        // Rounding off to previous hundered
        if (parseInt(intrst234Aprinciple, 10) > 100) {
            intrst234Aprinciple = Math.floor(parseInt(intrst234Aprinciple, 10) / 100) * parseInt('100', 10);
        }
    }

    if ((js.itrType == 'updated') && (js.fileItr == 'Y')) {
        Int234A = 0;
    } else {
        Int234A = zeroOrMore(parseFloat(parseInt(intrst234Aprinciple, 10) * parseFloat('0.01') * parseInt(MonthsAfterDueDate)));
    }

    //234B
    if ((TCMNTXTD + PTAX) > 10000 && isSrNoBP == false) {
        if (parseInt(advTax, 10) < ((TCMNTXTD + PTAX) * parseFloat('0.90'))) {
            var noOfMonthsTillSelfasst = parseInt('0', 10);
            var selfAsspaidDates = new Array();
            var selfAsspaidAmts = new Array();
            // to get all self assesment tax values
            var i = 0;
            if (js.paymentdetails != undefined && js.paymentdetails != null) {
                $.each(js.paymentdetails, function (k, data) {
                    dt1 = getDate(new Date(data.paydate));
                    if (checkFirstDateBefore(FyEdDt, dt1) && checkFirstDateBefore(dt1, filedate)) {
                        selfAsspaidDates[i] = dt1;
                        selfAsspaidAmts[i] = parseInt(coalesce(data.payamount), 10);
                        i = i + 1;
                    }
                });
            }

            var int234Bprinciple;
            if (js.itrType == 'updated') {
                int234Bprinciple = TCMNTXTD + PTAX - adv1 - adv2 - adv3 - adv4 - adv5 + refundClaimed;
            } else {
                int234Bprinciple = TCMNTXTD + PTAX - adv1 - adv2 - adv3 - adv4 - adv5;
            }
            // Rounding off to previous hundered
            if (parseInt(int234Bprinciple, 10) > 100) {
                int234Bprinciple = Math.floor(parseInt(int234Bprinciple, 10) / 100) * parseInt('100', 10);
            }

            //first part 234B
            if (selfAsspaidDates.length > 1) {
                //sort date wise entries
                for (var q = 0; q < selfAsspaidDates.length - 1; q++) {
                    for (var r = q + 1; r < selfAsspaidDates.length; r++) {
                        if (checkFirstDateBefore(selfAsspaidDates[q], selfAsspaidDates[r])) {

                        } else {
                            tempDate = selfAsspaidDates[q];
                            tempAmt = selfAsspaidAmts[q];

                            selfAsspaidDates[q] = selfAsspaidDates[r];
                            selfAsspaidAmts[q] = selfAsspaidAmts[r];

                            selfAsspaidDates[r] = tempDate;
                            selfAsspaidAmts[r] = tempAmt;
                        }
                    }
                }

                //consolidate monthwise entries
                var arrLen = selfAsspaidDates.length;
                var lastMonth = 0;
                var lastIndex = -1;
                var lastYear = 0;
                for (var q = 0; q < arrLen; q++) {
                    if (parseInt(selfAsspaidDates[q].substr(3, 2), 10) == lastMonth && parseInt(selfAsspaidDates[q].substr(8, 2), 10) == lastYear) {
                        selfAsspaidAmts[lastIndex] = parseInt(selfAsspaidAmts[lastIndex], 10) + parseInt(selfAsspaidAmts[q], 10);
                    } else {
                        lastMonth = parseInt(selfAsspaidDates[q].substr(3, 2), 10);
                        lastYear = parseInt(selfAsspaidDates[q].substr(8, 2), 10);
                        selfAsspaidAmts[++lastIndex] = selfAsspaidAmts[q];
                        selfAsspaidDates[lastIndex] = selfAsspaidDates[q];
                    }
                }
                selfAsspaidAmts.length = ++lastIndex;
                selfAsspaidDates.length = lastIndex;
            }

            if (selfAsspaidDates.length == 0) {
                noOfMonthsTillSelfasst = calcNoOfMonths(filedate, AyStDt);
            } else {
                noOfMonthsTillSelfasst = calcNoOfMonths(selfAsspaidDates[0], AyStDt);
            }

            intrst234Bi = parseInt(int234Bprinciple, 10) * parseFloat('0.01') * parseInt(noOfMonthsTillSelfasst);

            //second part 234B
            var intrst234Bprinciple2 = parseInt('0', 10);
            var noOfMonthsTillSelfasst2;
            var intrst234Bii = parseInt('0', 10);
            var partialSelfAssPaid = parseInt('0', 10);
            var k = parseInt('0', 10);
            var interestFrom;
            var interestTill;

            if (selfAsspaidDates.length != 0) {
                for (var i = 0; i < selfAsspaidDates.length; i++) {
                    partialSelfAssPaid = parseFloat(parseInt(partialSelfAssPaid, 10) + parseInt(selfAsspaidAmts[i], 10));
                    interestTill = filedate;
                    interestFrom = selfAsspaidDates[i];

                    if (js.itrType == 'updated') {
                        intrst234Bprinciple2 = zeroOrMore(parseFloat(parseInt(TCMNTXTD, 10) + parseInt(PTAX, 10) - parseInt(advTax, 10) + parseInt(Int234C, 10) + parseInt(intrst234Bi, 10) + parseInt(intrst234Bii, 10) + parseInt(Int234F, 10) - parseInt(partialSelfAssPaid, 10) + parseInt(refundClaimed, 10)));
                    } else {
                        intrst234Bprinciple2 = zeroOrMore(parseFloat(parseInt(TCMNTXTD, 10) + parseInt(PTAX, 10) - parseInt(advTax, 10) + parseInt(Int234C, 10) + parseInt(intrst234Bi, 10) + parseInt(intrst234Bii, 10) + parseInt(Int234F, 10) - parseInt(partialSelfAssPaid, 10)));
                    }

                    if (checkFirstDateBefore(duedate1, interestFrom)) {
                        intrst234Bprinciple2 = zeroOrMore(intrst234Bprinciple2 + parseInt(Int234A, 10));
                    }

                    // Rounding off to previous hundered
                    if (parseInt(intrst234Bprinciple2, 10) > parseInt('100', 10)) {
                        intrst234Bprinciple2 = Math.floor(parseInt(intrst234Bprinciple2, 10) / 100) * parseInt('100', 10);
                    }

                    //check if last paid challan
                    if (i != parseFloat(selfAsspaidDates.length - parseInt('1', 10))) {
                        for (k = i; k < parseFloat(selfAsspaidDates.length - parseInt('1', 10)); k++) {
                            if (selfAsspaidDates[k] != selfAsspaidDates[k + 1]) {
                                interestTill = selfAsspaidDates[k + 1];
                                interestFrom = selfAsspaidDates[k];
                                k = selfAsspaidDates.length;
                            }
                        }
                    }
                    noOfMonthsTillSelfasst2 = calcNoOfMonths(interestTill, interestFrom) - parseInt('1', 10);

                    if (parseInt(intrst234Bprinciple2, 10) < parseInt(int234Bprinciple, 10)) {
                        int234Bprinciple = intrst234Bprinciple2;
                        intrst234Bii = parseFloat(parseInt(intrst234Bii, 10) + (parseInt(intrst234Bprinciple2, 10) * parseFloat('0.01') * parseInt(noOfMonthsTillSelfasst2)));
                    } else {
                        intrst234Bii = parseFloat(parseInt(intrst234Bii, 10) + (parseInt(int234Bprinciple, 10) * parseFloat('0.01') * parseInt(noOfMonthsTillSelfasst2)));
                    }
                }
            }

            Int234B = intrst234Bi + intrst234Bii;
        }
    }

    js.Int234A = parseInt(Int234A, 10);
    js.Int234B = parseInt(Int234B, 10);
    js.Int234C = parseInt(Int234C, 10);
    js.Fee234F = Int234F;

    js.BalTax = Math.round((parseInt(TCMNTXTD, 10) + parseInt(PTAX, 10) - parseInt(adv1, 10) - parseInt(adv2, 10) - parseInt(adv3, 10) - parseInt(adv4, 10) - parseInt(adv5, 10) - parseInt(coalesce(selftax), 10)) / 10) * 10;
    //Net tax after intrest
    js.NetTax = Math.round((parseInt(TCMNTXTD, 10) + parseInt(PTAX, 10) + parseInt(Int234A, 10) + parseInt(Int234B, 10) + parseInt(Int234C, 10) + parseInt(Int234F, 10) - parseInt(adv1, 10) - parseInt(adv2, 10) - parseInt(adv3, 10) - parseInt(adv4, 10) - parseInt(adv5, 10) - parseInt(coalesce(selftax), 10)) / 10) * 10;
}

//Surcharge Calculation
var MNSUTX = function (tinc, TaxAftrRebate, tcmntaxsur, assYr, cStatus, spinc, normalinc, TaxNormal, dividend115_AD_20tax, dividend210_10tax) {
    var surc = 0;
    if (cStatus == "COOP") {
        if (tinc > 10000000 && tinc <= 100000000) {
            surc = parseInt(TaxAftrRebate * 0.07);
        } else if (tinc > 100000000) {
            surc = parseInt(TaxAftrRebate * 0.12);
        } else {
            surc = 0;
        }
    } else {
        if (tinc > 5000000 && tinc <= 10000000) {
            surc = parseInt((TaxAftrRebate * 10) / 100);
        } else if (tinc > 10000000 && tinc <= 20000000) {
            surc = parseInt((TaxAftrRebate * 15) / 100);
        } else if (tinc > 20000000 && tinc <= 50000000) {
            var taxByIncome = normalinc ? (TaxNormal / normalinc) * dinm : 0;
            var splitSum = cg112and111ATax + taxByIncome + dividend115_AD_20tax + dividend210_10tax;
            //income excluding capital gains/dividend eligible for the 15% surcharge cap
            var adjIncome = tinc - (cg112and111A + dinm + dividend_taxable_115ad + dividend_taxable_10_210_N);
            var normalRate = 0.25;
            if (adjIncome <= 20000000 && adjIncome > 10000000) {
                //total income crossed 2Cr only due to capital gains/dividend, so normal-rate income stays capped at 15%
                normalRate = 0.15;
            }
            surc = ((TaxAftrRebate - splitSum) * normalRate) + (splitSum * 0.15);
        } else if (tinc > 50000000) {
            var taxByIncome = normalinc ? (TaxNormal / normalinc) * dinm : 0;
            var splitSum = cg112and111ATax + taxByIncome + dividend115_AD_20tax + dividend210_10tax;
            var adjIncome = tinc - (cg112and111A + dinm + dividend_taxable_115ad + dividend_taxable_10_210_N);
            var normalRate = (oldnewslab == 'new' && assYr >= '2024') ? 0.25 : 0.37;
            if (oldnewslab != 'new' && adjIncome <= 50000000 && adjIncome > 20000000) {
                //total income crossed 5Cr only due to capital gains/dividend, so normal-rate income capped at 25%
                normalRate = 0.25;
            }
            surc = ((TaxAftrRebate - splitSum) * normalRate) + (splitSum * 0.15);
        }
    }
    if (income_chargeable60115BBEtax > 0) {
        surc = surc + parseInt((income_chargeable60115BBEtax) * 0.25);
    }

    //marginal relief to be calculate
    var TCSURCMG = 0;
    if (tinc > 5000000 && tinc < 5200000) {
        // TCSURCMG = (tinc - 5000000) - (TaxAftrRebate - tcmntaxsur);
        var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
        TCSURCMG = sumoftaxandSur - ((tinc - 5000000) + tcmntaxsur);
        TCSURCMG = surc - TCSURCMG;
        if (TCSURCMG < surc) {
            surc = TCSURCMG;
        }
    }
    else if (tinc > 10000000 && tinc < 10650000) {
        // TCSURCMG = (tinc - 10000000) - (TaxAftrRebate - tcmntaxsur);
        var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
        TCSURCMG = sumoftaxandSur - ((tinc - 10000000) + tcmntaxsur);
        TCSURCMG = surc - TCSURCMG;
        if (TCSURCMG < surc) {
            surc = TCSURCMG;
        }
    }
    else if (tinc > 20000000 && tinc < 20950000) {
        // TCSURCMG = (tinc - 20000000) - ((TaxAftrRebate) - (tcmntaxsur));
        // if (income_chargeable60115BBEtax > 0) {
        //     TCSURCMG = TCSURCMG;
        //     surc = surc + income_chargeable60115BBEtax + parseInt((income_chargeable60115BBEtax) * 0.25);
        // }
        var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
        TCSURCMG = sumoftaxandSur - ((tinc - 20000000) + tcmntaxsur);
        TCSURCMG = surc - TCSURCMG;
        if (TCSURCMG < surc) {
            surc = TCSURCMG;
        }
        // var surc15pct = parseInt((TaxAftrRebate * 15) / 100);
        // if (surc15pct < surc) {
        //     surc = surc15pct;
        // }
    }
    else if (tinc > 50000000 && tinc < 53100000) {
        // TCSURCMG = (tinc - 50000000) - (TaxAftrRebate - tcmntaxsur);
        var sumoftaxandSur = surc + TaxAftrRebate + income_chargeable60115BBEtax;
        TCSURCMG = sumoftaxandSur - ((tinc - 50000000) + tcmntaxsur);
        TCSURCMG = surc - TCSURCMG;
        if (TCSURCMG < surc) {
            surc = TCSURCMG;
        }
    }
    return surc;
}

//Tax on 1 crore use to calculate marginal relief
var TCMNSUTX = function (cStatus, rstatus, slablimit, totalinc, lt20, lt30, lt40, st15, lt10, normalinc, oldnewslab, lt11210, lt11211, lt11310, lt11410, dividend_taxable10per, dividend_taxable_115aca, dividend_taxable20, dividend_taxable_115ad, dividend_taxable_10_210_N, dividend_taxable_10_208_N, online_games_115bbj, lotteryinc, interest_taxable5per_6a, interest_taxable_5_115A, interest_taxable_4_Proviso, interest_taxable_9_6b_N, interest_taxable_10_115AC, interest_Taxable_20115A_115E, interest_Taxable_20_115AD, interest_Taxable_10_210_6e_N, interest_Taxable_10_208_6f_N, income_chargeable60115BBE, income_chargeable115BBF_10, income_chargeable115BBG_10, income_chargeable115BBA, income_from_royalty10, lt112A_12T) {
    var tstax = 0;
    var slaborg = slablimit;
    var tnm = 0;
    var taxnm = 0;

    if (rstatus == "NR") {
        slablimit = 0;
    }

    if (cStatus == "FIRM" || cStatus == "LLP") {
        if (!(totalinc < 10000000 || totalinc > 10650000)) {
            tmp1 = 10000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            if (normalinc > tmp1) {
                normalinc = tmp1;
                tmp1 = 0;
            } else {
                tmp1 = tmp1 - normalinc;
            }

            if (normalinc > 0) {
                taxnm = parseInt(normalinc * 0.30);
            } else {
                taxnm = 0;
            }

            tstax = taxnm + tstax;
        }
    }
    else if (cStatus == "COOP") {
        if (!(totalinc < 10000000 || totalinc > 10650000)) {
            tmp1 = 10000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj, lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            taxnm = TaxCoop(tmp1);
            tstax = taxnm + tstax + income_chargeable60115BBEtax;
        }
    }
    else if (cStatus == "COMPD" || cStatus == "COMPF") {
        if (!(totalinc < 100000000 || totalinc > 103100000)) {
            tmp1 = 100000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            taxnm = TaxComp(tmp1, cStatus);
            tstax = taxnm + tstax;
            if (cStatus == "COMPF") {
                tstax = tstax + tstax * 0.020;
            } else {
                tstax = tstax + tstax * 0.070;
            }
        }
        else if (!(totalinc < 10000000 || totalinc > 10450000)) {
            tmp1 = 10000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            taxnm = TaxComp(tmp1, cStatus);
            tstax = taxnm + tstax;
        }
    }
    else if (cStatus == "AOP") {
        if (totalinc < 10000000 && !(totalinc < 5000000 || totalinc > 5200000)) {
            tmp1 = 5000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }

            tstax = taxnm + tstax;
        }
        else if (totalinc >= 10000000 && !(totalinc < 10000000 || totalinc > 10650000)) {
            tmp1 = 10000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }

            tstax = taxnm + tstax;
            tstax = tstax + (tstax * 0.10);
        }
        else if (totalinc >= 20000000 && !(totalinc < 20000000 || totalinc > 20950000)) {
            tmp1 = 20000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }

            tstax = taxnm + tstax;
            tstax = tstax + (tstax * 0.15);
        }
        else if (totalinc >= 50000000 && !(totalinc < 50000000 || totalinc > 53100000)) {
            var tmp1Orig = 50000000;
            tmp1 = tmp1Orig;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            //income excluding capital gains/dividend eligible for the 15% surcharge cap, at the 5Cr threshold
            var adjIncomeThreshold = tmp1 - (cg112and111A + dinm + dividend_taxable_115ad + dividend_taxable_10_210_N);
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }
 
            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }
 
            var sptax = tstax;
            tstax = taxnm + tstax;
            //dividend-at-normal-rate tax share of taxnm, same proportion logic as the actual MNSUTX split
            var dividendThresholdTax = taxnm ? (taxnm / tmp1Orig) * dinm : 0;
            //tax on capital gains/dividend eligible for the 15% cap vs the remaining "normal rate" special income (lottery, interest, 115BBG/115BBJ etc.)
            var specialCapped = cg112and111ATax + dividendThresholdTax + dividend115_AD_20tax + dividend210_10tax;
            var otherSpecial = sptax - cg112and111ATax - dividend115_AD_20tax - dividend210_10tax;
            var normalPortion = (taxnm - dividendThresholdTax) + otherSpecial;
            var normalRate = (oldnewslab == "old") ? 0.37 : 0.25;
            if (oldnewslab == "old" && adjIncomeThreshold <= 50000000 && adjIncomeThreshold > 20000000) {
                //threshold income crossed 5Cr only due to capital gains/dividend, so normal-rate income capped at 25%
                normalRate = 0.25;
            }
            tstax = tstax + (normalPortion * normalRate) + (specialCapped * 0.15);
        }
    }
    else if (cStatus == "IND" || cStatus == "HUF") {
        if (totalinc < 10000000 && !(totalinc < 5000000 || totalinc > 5200000)) {
            tmp1 = 5000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }

            tstax = taxnm + tstax;
        }
        else if (totalinc >= 10000000 && !(totalinc < 10000000 || totalinc > 10650000)) {
            tmp1 = 10000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }

            tstax = taxnm + tstax;
            tstax = tstax + (tstax * 0.10);
        }
        else if (totalinc >= 20000000 && !(totalinc < 20000000 || totalinc > 20950000)) {
            tmp1 = 20000000;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }

            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }

            tstax = taxnm + tstax;
            tstax = tstax + (tstax * 0.15);
        }
        else if (totalinc >= 50000000 && !(totalinc < 50000000 || totalinc > 53100000)) {
            var tmp1Orig = 50000000;
            tmp1 = tmp1Orig;
            tstax = GetTaxSp(tmp1, normalinc, slablimit, true) - income_chargeable60115BBEtax;
            //income excluding capital gains/dividend eligible for the 15% surcharge cap, at the 5Cr threshold
            var adjIncomeThreshold = tmp1 - (cg112and111A + dinm + dividend_taxable_115ad + dividend_taxable_10_210_N);
            tmp1 = tmp1 - (lt20 + st15 + lt10 + lt11210 + lt30 + lt40 + lt11211 + lt11310 + lt11410 + dividend_taxable10per + dividend_taxable_115aca + dividend_taxable20 + dividend_taxable_115ad + dividend_taxable_10_210_N + dividend_taxable_10_208_N + online_games_115bbj + lotteryinc + interest_taxable5per_6a + interest_taxable_5_115A + interest_taxable_4_Proviso + interest_taxable_9_6b_N + interest_taxable_10_115AC + interest_Taxable_20115A_115E + interest_Taxable_20_115AD + interest_Taxable_10_210_6e_N + interest_Taxable_10_208_6f_N + income_chargeable115BBF_10 + income_chargeable115BBG_10 + income_chargeable115BBA + income_from_royalty10 + lt112A_12T);
            if (tmp1 < 0) {
                tmp1 = 0;
            }
 
            if (oldnewslab == "old") {
                taxnm = TaxIndOld(slablimitorg, tmp1);
            } else {
                taxnm = TaxIndNew(slablimitorg, tmp1);
            }
 
            var sptax = tstax;
            tstax = taxnm + tstax;
            //dividend-at-normal-rate tax share of taxnm, same proportion logic as the actual MNSUTX split
            var dividendThresholdTax = taxnm ? (taxnm / tmp1Orig) * dinm : 0;
            //tax on capital gains/dividend eligible for the 15% cap vs the remaining "normal rate" special income (lottery, interest, 115BBG/115BBJ etc.)
            var specialCapped = cg112and111ATax + dividendThresholdTax + dividend115_AD_20tax + dividend210_10tax;
            var otherSpecial = sptax - cg112and111ATax - dividend115_AD_20tax - dividend210_10tax;
            var normalPortion = (taxnm - dividendThresholdTax) + otherSpecial;
            var normalRate = (oldnewslab == "old") ? 0.37 : 0.25;
            if (oldnewslab == "old" && adjIncomeThreshold <= 50000000 && adjIncomeThreshold > 20000000) {
                //threshold income crossed 5Cr only due to capital gains/dividend, so normal-rate income capped at 25%
                normalRate = 0.25;
            }
            tstax = tstax + (normalPortion * normalRate) + (specialCapped * 0.15);
        }
    }

    return tstax;
}

//tax calculaion on special rate income
function GetTaxSp(tmpinc, normalinc, slablimit, forsur) {
    lotteryTax = 0;
    lt20tax = 0;
    st15tax = 0;
    lt10tax = 0;
    lt11211tax = 0;
    lt11210tax = 0;
    lt11310tax = 0;
    lt112A_12Ttax = 0;
    lt11410tax = 0;
    lt30tax = 0;
    lt40tax = 0;
    dividend115AC10tax = 0;
    dividend115ACA_10tax = 0;
    dividend115A_20tax = 0;
    dividend115_AD_20tax = 0;
    dividend210_10tax = 0;
    dividend208_10tax = 0;
    onlineGame115BBJtax = 0;
    interest_taxable5tax = 0;
    interest_taxable_5_115Atax = 0;
    interest_taxable_4_115APtax = 0;
    interest_taxable_9_6b_Ntax = 0;
    interest_taxable_10_115ACtax = 0;
    interest_Taxable_20115A_115Etax = 0;
    interest_Taxable_20_115ADtax = 0;
    interest_Taxable_10_210_6e_Ntax = 0;
    interest_Taxable_10_208_6f_Ntax = 0;
    income_chargeable60115BBEtax = 0;
    income_chargeable115BBF_10tax = 0;
    income_chargeable115BBG_10tax = 0;
    income_chargeable115BBAtax = 0;
    income_from_royalty10tax = 0;
    stnmtax = 0;
    dinmtax = 0;
    if (cStatus == "AOP") {
        slablimit = 0;
    }

    var tnormalinc = normalinc;

    var tlt20 = lt20;
    if (tlt20 > tmpinc) {
        tlt20 = tmpinc;
        tmpinc = 0;
    } else {
        tmpinc = tmpinc - tlt20;
    }

    if (tlt20 > 0) {
        if (slablimit > tnormalinc && rstatus != "NR") {
            lt20tax = parseInt((tlt20 - (slablimit - tnormalinc)) * 0.20);
            if (lt20tax < 0) {
                lt20tax = 0;
            }

            if (forsur == false) {
                if (lt201 > (slablimit - tnormalinc)) {
                    lt20tx1 = parseInt((lt201 - (slablimit - tnormalinc)) * 0.20);
                    tnormalinc = slablimit;
                } else {
                    tnormalinc = tnormalinc + lt201;
                }

                if (lt202 > (slablimit - tnormalinc)) {
                    lt20tx2 = parseInt((lt202 - (slablimit - tnormalinc)) * 0.20);
                    tnormalinc = slablimit;
                } else {
                    tnormalinc = tnormalinc + lt202;
                }

                if (lt203 > (slablimit - tnormalinc)) {
                    lt20tx3 = parseInt((lt203 - (slablimit - tnormalinc)) * 0.20);
                    tnormalinc = slablimit;
                } else {
                    tnormalinc = tnormalinc + lt203;
                }

                if (lt204 > (slablimit - tnormalinc)) {
                    lt20tx4 = parseInt((lt204 - (slablimit - tnormalinc)) * 0.20);
                    tnormalinc = slablimit;
                } else {
                    tnormalinc = tnormalinc + lt204;
                }

                if (lt205 > (slablimit - tnormalinc)) {
                    lt20tx5 = parseInt((lt205 - (slablimit - tnormalinc)) * 0.20);
                    tnormalinc = slablimit;
                } else {
                    tnormalinc = tnormalinc + lt205;
                }

                lt20tx2 = lt20tx2 + lt20tx1;
                lt20tx3 = lt20tx3 + lt20tx2;
                lt20tx4 = lt20tx4 + lt20tx3;
                lt20tx5 = lt20tx5 + lt20tx4;
            }
        }
        else {
            lt20tax = parseInt(tlt20 * 0.20);
            var CSGAD20LS = 0;
            if (forsur == false) {

                var LCSGT20IN = lt201 - CSGAD20LS;
                if (LCSGT20IN > 0) {
                    lt20tx1 = parseInt(LCSGT20IN * 0.20);
                }

                LCSGT20IN = LCSGT20IN + lt202;

                if (LCSGT20IN > 0) {
                    lt20tx2 = parseInt(LCSGT20IN * 0.20);
                }

                LCSGT20IN = LCSGT20IN + lt203;

                if (LCSGT20IN > 0) {
                    lt20tx3 = parseInt(LCSGT20IN * 0.20);
                }

                LCSGT20IN = LCSGT20IN + lt204;

                if (LCSGT20IN > 0) {
                    lt20tx4 = parseInt(LCSGT20IN * 0.20);
                }

                LCSGT20IN = LCSGT20IN + lt205;

                if (LCSGT20IN > 0) {
                    lt20tx5 = parseInt(LCSGT20IN * 0.20);
                }
            }
        }
    }

    var tst16 = lt30;

    if (tst16 > tmpinc) {
        tst16 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - tst16;
    }

    tnm = normalinc + tlt20;
    var TCSGAD30LS = 0;
    if (tst16 > 0) {
        if (slablimit > tnm) {
            lt30tax = parseInt((tst16 - (slablimit - tnm)) * 0.20);
            if (lt30tax < 0) {
                lt30tax = 0;
            }
            TCSGAD30LS = slablimit - tnm;
        } else {
            lt30tax = parseInt(tst16 * 0.20);
        }

        if (forsur == false) {
            lt30tx1 = 0;
            lt30tx2 = 0;
            lt30tx3 = 0;
            lt30tx4 = 0;
            lt30tx5 = 0;

            var TCSGT30IN = lt301 - TCSGAD30LS;
            if (TCSGT30IN > 0) {
                lt30tx1 = parseInt(TCSGT30IN * 0.20);
            }

            TCSGT30IN = TCSGT30IN + lt302;

            if (TCSGT30IN > 0) {
                lt30tx2 = parseInt(TCSGT30IN * 0.20);
            }

            TCSGT30IN = TCSGT30IN + lt303;

            if (TCSGT30IN > 0) {
                lt30tx3 = parseInt(TCSGT30IN * 0.20);
            }

            TCSGT30IN = TCSGT30IN + lt304;

            if (TCSGT30IN > 0) {
                lt30tx4 = parseInt(TCSGT30IN * 0.20);
            }

            TCSGT30IN = TCSGT30IN + lt305;

            if (TCSGT30IN > 0) {
                lt30tx5 = parseInt(TCSGT30IN * 0.20);
            }
        }
    }

    var tst15 = st15a;

    if (tst15 > tmpinc) {
        tst15 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - tst15;
    }

    tnm = normalinc + tlt20 + tst16;
    var TCSGAD10LS = 0;

    if (tst15 > 0) {
        if (slablimit > tnm) {
            st15tax = parseInt((tst15 - (slablimit - tnm)) * 0.15);
            if (st15tax < 0) {
                st15tax = 0;
            }
            TCSGAD10LS = slablimit - tnm;
        } else {
            st15tax = parseInt(tst15 * 0.15);
        }

        if (forsur == false) {
            st15tx1 = 0;
            st15tx2 = 0;
            st15tx3 = 0;
            st15tx4 = 0;
            st15tx5 = 0;

            var TCSGT10IN = st15A1 - TCSGAD10LS;
            if (TCSGT10IN > 0) {
                st15tx1 = parseInt(TCSGT10IN * 0.15);
            }

            TCSGT10IN = TCSGT10IN + st15A2;

            if (TCSGT10IN > 0) {
                st15tx2 = parseInt(TCSGT10IN * 0.15);
            }

            TCSGT10IN = TCSGT10IN + st15A3;

            if (TCSGT10IN > 0) {
                st15tx3 = parseInt(TCSGT10IN * 0.15);
            }

            TCSGT10IN = TCSGT10IN + st15A4;

            if (TCSGT10IN > 0) {
                st15tx4 = parseInt(TCSGT10IN * 0.15);
            }

            TCSGT10IN = TCSGT10IN + st15A5;

            if (TCSGT10IN > 0) {
                st15tx5 = parseInt(TCSGT10IN * 0.15);
            }
        }
    }

    var tst17 = lt40;

    if (tst17 > tmpinc) {
        tst17 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - tst17;
    }

    var TCSGAD40LS = 0;
    if (tst17 > 0) {
        lt40tax = parseInt((tst17) * 0.30);
        if (lt40tax < 0) {
            lt40tax = 0;
        }

        if (forsur == false) {
            lt40tx1 = 0;
            lt40tx2 = 0;
            lt40tx3 = 0;
            lt40tx4 = 0;
            lt40tx5 = 0;

            var TCSGT40IN = lt401 - TCSGAD40LS;
            if (TCSGT40IN > 0) {
                lt40tx1 = parseInt(TCSGT40IN * 0.30);
            }

            TCSGT40IN = TCSGT40IN + lt402;

            if (TCSGT40IN > 0) {
                lt40tx2 = parseInt(TCSGT40IN * 0.30);
            }

            TCSGT40IN = TCSGT40IN + lt403;

            if (TCSGT40IN > 0) {
                lt40tx3 = parseInt(TCSGT40IN * 0.30);
            }

            TCSGT40IN = TCSGT40IN + lt404;

            if (TCSGT40IN > 0) {
                lt40tx4 = parseInt(TCSGT40IN * 0.30);
            }

            TCSGT40IN = TCSGT40IN + lt405;

            if (TCSGT40IN > 0) {
                lt40tx5 = parseInt(TCSGT40IN * 0.30);
            }

        }
    }

    // Interest Taxable @5% 115A(1)(a)(iia),115A(1) (a)(iiaa),115A(1) (a)(iiac) etc/Interest Taxable @5%115A(1) (a)(iiab) (FII)
    var intrestAt5per = interest_taxable5per_6a;
    if (intrestAt5per > tmpinc) {
        intrestAt5per = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt5per;
    }
    if (intrestAt5per > 0) {
        interest_taxable5tax = parseInt((intrestAt5per) * 0.05);
        if (interest_taxable5tax < 0) {
            interest_taxable5tax = 0;
        }
    }

    // Interest Taxable @5%115A(1) (a)(iiab) (FII)
    var intrestAt5per115A = interest_taxable_5_115A;
    if (intrestAt5per115A > tmpinc) {
        intrestAt5per115A = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt5per115A;
    }
    if (intrestAt5per115A > 0) {
        interest_taxable_5_115Atax = parseInt((intrestAt5per115A) * 0.05);
        if (interest_taxable_5_115Atax < 0) {
            interest_taxable_5_115Atax = 0;
        }
    }

    // Interest Taxable @4%,Proviso to sec.115A(1) (a)(iiaa)
    var intrestAt4per115AP = interest_taxable_4_Proviso;
    if (intrestAt4per115AP > tmpinc) {
        intrestAt4per115AP = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt4per115AP;
    }
    if (intrestAt4per115AP > 0) {
        interest_taxable_4_115APtax = parseInt((intrestAt4per115AP) * 0.04);
        if (interest_taxable_4_115APtax < 0) {
            interest_taxable_4_115APtax = 0;
        }
    }

    //  Interest Taxable @9% u/s 207(1)
    var intrestAt9per207 = interest_taxable_9_6b_N;
    if (intrestAt9per207 > tmpinc) {
        intrestAt9per207 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt9per207;
    }
    if (intrestAt9per207 > 0) {
        interest_taxable_9_6b_Ntax = parseInt((intrestAt9per207) * 0.09);
        if (interest_taxable_9_6b_Ntax < 0) {
            interest_taxable_9_6b_Ntax = 0;
        }
    }

    //  Interest Taxable @10%- Sec.115AC(1)(b)etc
    var intrestAt10per115AC = interest_taxable_10_115AC;
    if (intrestAt10per115AC > tmpinc) {
        intrestAt10per115AC = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt10per115AC;
    }
    if (intrestAt10per115AC > 0) {
        interest_taxable_10_115ACtax = parseInt((intrestAt10per115AC) * 0.10);
        if (interest_taxable_10_115ACtax < 0) {
            interest_taxable_10_115ACtax = 0;
        }
    }

    //   Interest Taxable @20%- Sec.115A(1) (a)(iii),115A(1)(a)(ii),115E(a) etc
    var intrestAt20per115AC = interest_Taxable_20115A_115E;
    if (intrestAt20per115AC > tmpinc) {
        intrestAt20per115AC = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt20per115AC;
    }
    if (intrestAt20per115AC > 0) {
        interest_Taxable_20115A_115Etax = parseInt((intrestAt20per115AC) * 0.20);
        if (interest_Taxable_20115A_115Etax < 0) {
            interest_Taxable_20115A_115Etax = 0;
        }
    }

    //   Interest Taxable @20%- Sec.115AD(1)(i)(FII)etc
    var intrestAt20per115AD = interest_Taxable_20_115AD;
    if (intrestAt20per115AD > tmpinc) {
        intrestAt20per115AD = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt20per115AD;
    }
    if (intrestAt20per115AD > 0) {
        interest_Taxable_20_115ADtax = parseInt((intrestAt20per115AD) * 0.20);
        if (interest_Taxable_20_115ADtax < 0) {
            interest_Taxable_20_115ADtax = 0;
        }
    }

    //   Interest Taxable @10% u/s 210(1)
    var intrestAt10per210 = interest_Taxable_10_210_6e_N;
    if (intrestAt10per210 > tmpinc) {
        intrestAt10per210 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt10per210;
    }
    if (intrestAt10per210 > 0) {
        interest_Taxable_10_210_6e_Ntax = parseInt((intrestAt10per210) * 0.10);
        if (interest_Taxable_10_210_6e_Ntax < 0) {
            interest_Taxable_10_210_6e_Ntax = 0;
        }
    }

    //   Interest Taxable @10% u/s 210(1)
    var intrestAt10per208 = interest_Taxable_10_208_6f_N;
    if (intrestAt10per208 > tmpinc) {
        intrestAt10per208 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt10per208;
    }
    if (intrestAt10per208 > 0) {
        interest_Taxable_10_208_6f_Ntax = parseInt((intrestAt10per208) * 0.10);
        if (interest_Taxable_10_208_6f_Ntax < 0) {
            interest_Taxable_10_208_6f_Ntax = 0;
        }
    }

    //   Interest Taxable @60%-  Income chargeable u/s 115BBE
    var intrestAt60per = income_chargeable60115BBE;
    if (intrestAt60per > tmpinc) {
        intrestAt60per = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt60per;
    }
    if (intrestAt60per > 0) {
        income_chargeable60115BBEtax = parseInt((intrestAt60per) * 0.60);
        if (income_chargeable60115BBEtax < 0) {
            income_chargeable60115BBEtax = 0;
        }
    }

    //   Interest Taxable @10%-  Income chargeable u/s 115BBF
    var intrestAt10perBBF = income_chargeable115BBF_10;
    if (intrestAt10perBBF > tmpinc) {
        intrestAt10perBBF = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt10perBBF;
    }
    if (intrestAt10perBBF > 0) {
        income_chargeable115BBF_10tax = parseInt((intrestAt10perBBF) * 0.10);
        if (income_chargeable115BBF_10tax < 0) {
            income_chargeable115BBF_10tax = 0;
        }
    }

    //   Interest Taxable @10%-  Income chargeable u/s 115BBF
    var intrestAt10perBBG = income_chargeable115BBG_10;
    if (intrestAt10perBBG > tmpinc) {
        intrestAt10perBBG = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt10perBBG;
    }
    if (intrestAt10perBBG > 0) {
        income_chargeable115BBG_10tax = parseInt((intrestAt10perBBG) * 0.10);
        if (income_chargeable115BBG_10tax < 0) {
            income_chargeable115BBG_10tax = 0;
        }
    }

    //   Interest Taxable @20%-  Income chargeable u/s 115BBA
    var intrestAt20perBBA = income_chargeable115BBA;
    if (intrestAt20perBBA > tmpinc) {
        intrestAt20perBBA = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt20perBBA;
    }
    if (intrestAt20perBBA > 0) {
        income_chargeable115BBAtax = parseInt((intrestAt20perBBA) * 0.20);
        if (income_chargeable115BBAtax < 0) {
            income_chargeable115BBAtax = 0;
        }
    }

    //   Interest Taxable @10%-  Income chargeable u/s 115BBA
    var intrestAt10royalty = income_from_royalty10;
    if (intrestAt10royalty > tmpinc) {
        intrestAt10royalty = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - intrestAt10royalty;
    }
    if (intrestAt10royalty > 0) {
        income_from_royalty10tax = parseInt((intrestAt10royalty) * 0.20);
        if (income_from_royalty10tax < 0) {
            income_from_royalty10tax = 0;
        }
    }

    // Dividend Taxable@10% u/s 115AC,115AD(specified fund), proviso to Sec.115A(1)(a)(A) etc.
    var dividend10 = dividend_taxable10per;
    if (dividend10 > tmpinc) {
        dividend10 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - dividend10;
    }
    var divident_115AC = 0;
    if (dividend10 > 0) {
        dividend115AC10tax = parseInt((dividend10) * 0.10);
        if (dividend115AC10tax < 0) {
            dividend115AC10tax = 0;
        }
        if (forsur == false) {
            dividend115AC10tx1 = 0;
            dividend115AC10tx2 = 0;
            dividend115AC10tx3 = 0;
            dividend115AC10tx4 = 0;
            dividend115AC10tx5 = 0;
            var DIVIDEND_IN = dividend_taxable10per_1 - divident_115AC;
            if (DIVIDEND_IN > 0) {
                dividend115AC10tx1 = parseInt(DIVIDEND_IN * 0.10);
            }
            DIVIDEND_IN = DIVIDEND_IN + dividend_taxable10per_2;
            if (DIVIDEND_IN > 0) {
                dividend115AC10tx2 = parseInt(DIVIDEND_IN * 0.10);
            }
            DIVIDEND_IN = DIVIDEND_IN + dividend_taxable10per_3;
            if (DIVIDEND_IN > 0) {
                dividend115AC10tx3 = parseInt(DIVIDEND_IN * 0.10);
            }
            DIVIDEND_IN = DIVIDEND_IN + dividend_taxable10per_4;
            if (DIVIDEND_IN > 0) {
                dividend115AC10tx4 = parseInt(DIVIDEND_IN * 0.10);
            }
            DIVIDEND_IN = DIVIDEND_IN + dividend_taxable10per_5;
            if (DIVIDEND_IN > 0) {
                dividend115AC10tx5 = parseInt(DIVIDEND_IN * 0.10);
            }
        }
    }

    //  Dividend Taxable@10% u/s  115ACA etc.
    var dividendACA10 = dividend_taxable_115aca;
    if (dividendACA10 > tmpinc) {
        dividendACA10 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - dividendACA10;
    }
    var divident_115ACA = 0;
    if (dividendACA10 > 0) {
        dividend115ACA_10tax = parseInt((dividendACA10) * 0.10);
        if (dividend115ACA_10tax < 0) {
            dividend115ACA_10tax = 0;
        }
        if (forsur == false) {
            dividend115ACA_10tx1 = 0;
            dividend115ACA_10tx2 = 0;
            dividend115ACA_10tx3 = 0;
            dividend115ACA_10tx4 = 0;
            dividend115ACA_10tx5 = 0;
            var DIVIDENDACA_IN = dividend_taxable_115aca_1 - divident_115ACA;
            if (DIVIDENDACA_IN > 0) {
                dividend115ACA_10tx1 = parseInt(DIVIDENDACA_IN * 0.10);
            }
            DIVIDENDACA_IN = DIVIDENDACA_IN + dividend_taxable_115aca_2;
            if (DIVIDENDACA_IN > 0) {
                dividend115ACA_10tx2 = parseInt(DIVIDENDACA_IN * 0.10);
            }
            DIVIDENDACA_IN = DIVIDENDACA_IN + dividend_taxable_115aca_3;
            if (DIVIDENDACA_IN > 0) {
                dividend115ACA_10tx3 = parseInt(DIVIDENDACA_IN * 0.10);
            }
            DIVIDENDACA_IN = DIVIDENDACA_IN + dividend_taxable_115aca_4;
            if (DIVIDENDACA_IN > 0) {
                dividend115ACA_10tx4 = parseInt(DIVIDENDACA_IN * 0.10);
            }
            DIVIDENDACA_IN = DIVIDENDACA_IN + dividend_taxable_115aca_5;
            if (DIVIDENDACA_IN > 0) {
                dividend115ACA_10tx5 = parseInt(DIVIDENDACA_IN * 0.10);
            }
        }
    }

    //  Dividend Taxable@20% u/s  115A etc.
    var dividendA20 = dividend_taxable20;
    if (dividendA20 > tmpinc) {
        dividendA20 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - dividendA20;
    }
    var divident_115A = 0;
    if (dividendA20 > 0) {
        dividend115A_20tax = parseInt((dividendA20) * 0.20);
        if (dividend115A_20tax < 0) {
            dividend115A_20tax = 0;
        }
        if (forsur == false) {
            dividend115A_20tx1 = 0;
            dividend115A_20tx2 = 0;
            dividend115A_20tx3 = 0;
            dividend115A_20tx4 = 0;
            dividend115A_20tx5 = 0;
            var DIVIDENDA20_IN = dividend_taxable20_1 - divident_115A;
            if (DIVIDENDA20_IN > 0) {
                dividend115A_20tx1 = parseInt(DIVIDENDA20_IN * 0.20);
            }
            DIVIDENDA20_IN = DIVIDENDA20_IN + dividend_taxable20_2;
            if (DIVIDENDA20_IN > 0) {
                dividend115A_20tx2 = parseInt(DIVIDENDA20_IN * 0.20);
            }
            DIVIDENDA20_IN = DIVIDENDA20_IN + dividend_taxable20_3;
            if (DIVIDENDA20_IN > 0) {
                dividend115A_20tx3 = parseInt(DIVIDENDA20_IN * 0.20);
            }
            DIVIDENDA20_IN = DIVIDENDA20_IN + dividend_taxable20_4;
            if (DIVIDENDA20_IN > 0) {
                dividend115A_20tx4 = parseInt(DIVIDENDA20_IN * 0.20);
            }
            DIVIDENDA20_IN = DIVIDENDA20_IN + dividend_taxable20_5;
            if (DIVIDENDA20_IN > 0) {
                dividend115A_20tx5 = parseInt(DIVIDENDA20_IN * 0.20);
            }
        }
    }

    //  Dividend Taxable@20% u/s  115AD etc.
    var dividend115AD20 = dividend_taxable_115ad;
    if (dividend115AD20 > tmpinc) {
        dividend115AD20 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - dividend115AD20;
    }
    var divident_115AD = 0;
    if (dividend115AD20 > 0) {
        dividend115_AD_20tax = parseInt((dividend115AD20) * 0.20);
        if (dividend115_AD_20tax < 0) {
            dividend115_AD_20tax = 0;
        }
        if (forsur == false) {
            dividend115_AD_20tx1 = 0;
            dividend115_AD_20tx2 = 0;
            dividend115_AD_20tx3 = 0;
            dividend115_AD_20tx4 = 0;
            dividend115_AD_20tx5 = 0;
            var DIVIDEND_AD_20_IN = dividend_taxable_115ad_1 - divident_115AD;
            if (DIVIDEND_AD_20_IN > 0) {
                dividend115_AD_20tx1 = parseInt(DIVIDEND_AD_20_IN * 0.20);
            }
            DIVIDEND_AD_20_IN = DIVIDEND_AD_20_IN + dividend_taxable_115ad_2;
            if (DIVIDEND_AD_20_IN > 0) {
                dividend115_AD_20tx2 = parseInt(DIVIDEND_AD_20_IN * 0.20);
            }
            DIVIDEND_AD_20_IN = DIVIDEND_AD_20_IN + dividend_taxable_115ad_3;
            if (DIVIDEND_AD_20_IN > 0) {
                dividend115_AD_20tx3 = parseInt(DIVIDEND_AD_20_IN * 0.20);
            }
            DIVIDEND_AD_20_IN = DIVIDEND_AD_20_IN + dividend_taxable_115ad_4;
            if (DIVIDEND_AD_20_IN > 0) {
                dividend115_AD_20tx4 = parseInt(DIVIDEND_AD_20_IN * 0.20);
            }
            DIVIDEND_AD_20_IN = DIVIDEND_AD_20_IN + dividend_taxable_115ad_5;
            if (DIVIDEND_AD_20_IN > 0) {
                dividend115_AD_20tx5 = parseInt(DIVIDEND_AD_20_IN * 0.20);
            }
        }
    }

    // Dividend Taxable @10% u/s 210(1).
    var dividend21010 = dividend_taxable_10_210_N;
    if (dividend21010 > tmpinc) {
        dividend21010 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - dividend21010;
    }
    var divident_210_10 = 0;
    if (dividend21010 > 0) {
        dividend210_10tax = parseInt((dividend21010) * 0.10);
        if (dividend210_10tax < 0) {
            dividend210_10tax = 0;
        }
        if (forsur == false) {
            dividend210_10tx1 = 0;
            dividend210_10tx2 = 0;
            dividend210_10tx3 = 0;
            dividend210_10tx4 = 0;
            dividend210_10tx5 = 0;
            var DIVIDEND_210_10_IN = dividend_taxable_10_210_N_1 - divident_210_10;
            if (DIVIDEND_210_10_IN > 0) {
                dividend210_10tx1 = parseInt(DIVIDEND_210_10_IN * 0.10);
            }
            DIVIDEND_210_10_IN = DIVIDEND_210_10_IN + dividend_taxable_10_210_N_2;
            if (DIVIDEND_210_10_IN > 0) {
                dividend210_10tx2 = parseInt(DIVIDEND_210_10_IN * 0.10);
            }
            DIVIDEND_210_10_IN = DIVIDEND_210_10_IN + dividend_taxable_10_210_N_3;
            if (DIVIDEND_210_10_IN > 0) {
                dividend210_10tx3 = parseInt(DIVIDEND_210_10_IN * 0.10);
            }
            DIVIDEND_210_10_IN = DIVIDEND_210_10_IN + dividend_taxable_10_210_N_4;
            if (DIVIDEND_210_10_IN > 0) {
                dividend210_10tx4 = parseInt(DIVIDEND_210_10_IN * 0.10);
            }
            DIVIDEND_210_10_IN = DIVIDEND_210_10_IN + dividend_taxable_10_210_N_5;
            if (DIVIDEND_210_10_IN > 0) {
                dividend210_10tx5 = parseInt(DIVIDEND_210_10_IN * 0.10);
            }
        }
    }

    // Dividend Taxable @10% u/s 208(1).
    var dividend20810 = dividend_taxable_10_208_N;
    if (dividend20810 > tmpinc) {
        dividend20810 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - dividend20810;
    }
    var divident_208_10 = 0;
    if (dividend20810 > 0) {
        dividend208_10tax = parseInt((dividend20810) * 0.10);
        if (dividend208_10tax < 0) {
            dividend208_10tax = 0;
        }
        if (forsur == false) {
            dividend208_10tx1 = 0;
            dividend208_10tx2 = 0;
            dividend208_10tx3 = 0;
            dividend208_10tx4 = 0;
            dividend208_10tx5 = 0;
            var DIVIDEND_208_10_IN = dividend_taxable_10_208_N_1 - divident_208_10;
            if (DIVIDEND_208_10_IN > 0) {
                dividend208_10tx1 = parseInt(DIVIDEND_208_10_IN * 0.10);
            }
            DIVIDEND_208_10_IN = DIVIDEND_208_10_IN + dividend_taxable_10_208_N_2;
            if (DIVIDEND_208_10_IN > 0) {
                dividend208_10tx2 = parseInt(DIVIDEND_208_10_IN * 0.10);
            }
            DIVIDEND_208_10_IN = DIVIDEND_208_10_IN + dividend_taxable_10_208_N_3;
            if (DIVIDEND_208_10_IN > 0) {
                dividend208_10tx3 = parseInt(DIVIDEND_208_10_IN * 0.10);
            }
            DIVIDEND_208_10_IN = DIVIDEND_208_10_IN + dividend_taxable_10_208_N_4;
            if (DIVIDEND_208_10_IN > 0) {
                dividend208_10tx4 = parseInt(DIVIDEND_208_10_IN * 0.10);
            }
            DIVIDEND_208_10_IN = DIVIDEND_208_10_IN + dividend_taxable_10_208_N_5;
            if (DIVIDEND_208_10_IN > 0) {
                dividend208_10tx5 = parseInt(DIVIDEND_208_10_IN * 0.10);
            }
        }
    }

    //  winning lottery @30% u/s  115AD etc.
    var winning_lottery30 = lotteryinc;
    if (winning_lottery30 > tmpinc) {
        winning_lottery30 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - winning_lottery30;
    }
    var lottery_winning = 0;
    if (winning_lottery30 > 0) {
        lotteryTax = parseInt((winning_lottery30) * 0.30);
        if (lotteryTax < 0) {
            lotteryTax = 0;
        }
        if (forsur == false) {
            lotteryTx1 = 0;
            lotteryTx2 = 0;
            lotteryTx3 = 0;
            lotteryTx5 = 0;
            lotteryTx5 = 0;
            var LOTTERY_30_IN = inning_lottery1 - lottery_winning;
            if (LOTTERY_30_IN > 0) {
                lotteryTx1 = parseInt(LOTTERY_30_IN * 0.30);
            }
            LOTTERY_30_IN = LOTTERY_30_IN + inning_lottery2;
            if (LOTTERY_30_IN > 0) {
                lotteryTx2 = parseInt(LOTTERY_30_IN * 0.30);
            }
            LOTTERY_30_IN = LOTTERY_30_IN + inning_lottery3;
            if (LOTTERY_30_IN > 0) {
                lotteryTx3 = parseInt(LOTTERY_30_IN * 0.30);
            }
            LOTTERY_30_IN = LOTTERY_30_IN + inning_lottery4;
            if (LOTTERY_30_IN > 0) {
                lotteryTx4 = parseInt(LOTTERY_30_IN * 0.30);
            }
            LOTTERY_30_IN = LOTTERY_30_IN + inning_lottery5;
            if (LOTTERY_30_IN > 0) {
                lotteryTx5 = parseInt(LOTTERY_30_IN * 0.30);
            }
        }
    }

    // online game @30% u/s  115AD etc.
    var onlineGmaes30 = online_games_115bbj;
    if (onlineGmaes30 > tmpinc) {
        onlineGmaes30 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - onlineGmaes30;
    }
    var online_game = 0;
    if (onlineGmaes30 > 0) {
        onlineGame115BBJtax = parseInt((onlineGmaes30) * 0.30);
        if (onlineGame115BBJtax < 0) {
            onlineGame115BBJtax = 0;
        }
        if (forsur == false) {
            // online_games_115bbj_1 = 0;
            onlineGame115BBJtx1 = 0;
            onlineGame115BBJtx2 = 0;
            onlineGame115BBJtx3 = 0;
            onlineGame115BBJtx4 = 0;
            onlineGame115BBJtx5 = 0;
            var ONLINEGAMES_30_IN = online_games_115bbj_1 - online_game;
            if (ONLINEGAMES_30_IN > 0) {
                onlineGame115BBJtx1 = parseInt(ONLINEGAMES_30_IN * 0.30);
            }
            ONLINEGAMES_30_IN = ONLINEGAMES_30_IN + online_games_115bbj_2;
            if (ONLINEGAMES_30_IN > 0) {
                onlineGame115BBJtx2 = parseInt(ONLINEGAMES_30_IN * 0.30);
            }
            ONLINEGAMES_30_IN = ONLINEGAMES_30_IN + online_games_115bbj_3;
            if (ONLINEGAMES_30_IN > 0) {
                onlineGame115BBJtx3 = parseInt(ONLINEGAMES_30_IN * 0.30);
            }
            ONLINEGAMES_30_IN = ONLINEGAMES_30_IN + online_games_115bbj_4;
            if (ONLINEGAMES_30_IN > 0) {
                onlineGame115BBJtx4 = parseInt(ONLINEGAMES_30_IN * 0.30);
            }
            ONLINEGAMES_30_IN = ONLINEGAMES_30_IN + online_games_115bbj_5;
            if (ONLINEGAMES_30_IN > 0) {
                onlineGame115BBJtx5 = parseInt(ONLINEGAMES_30_IN * 0.30);
            }
        }
    }

    var tst19 = lt11310;
    if (parseInt(assYr) >= 2027) {
        taxprc = 0.125;  // for TAX year 2026-27 and onwards
    } else {
        taxprc = 0.10;  // for assessment year 2025-26 and before
    }

    if (tst19 > tmpinc) {
        tst19 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - tst19;
    }

    var TCLGAD11310LS = 0;
    if (tst19 > 0) {
        lt11310tax = parseInt((tst19) * taxprc);
        if (lt11310tax < 0) {
            lt11310tax = 0;
        }

        if (forsur == false) {
            lt11310tx1 = 0;
            lt11310tx2 = 0;
            lt11310tx3 = 0;
            lt11310tx4 = 0;
            lt11310tx5 = 0;

            var TCLGAD11310IN = lt113101 - TCLGAD11310LS;
            if (TCLGAD11310IN > 0) {
                lt11310tx1 = parseInt(TCLGAD11310IN * taxprc);
            }

            TCLGAD11310IN = TCLGAD11310IN + lt113102;

            if (TCLGAD11310IN > 0) {
                lt11310tx2 = parseInt(TCLGAD11310IN * taxprc);
            }

            TCLGAD11310IN = TCLGAD11310IN + lt113103;

            if (TCLGAD11310IN > 0) {
                lt11310tx3 = parseInt(TCLGAD11310IN * taxprc);
            }

            TCLGAD11310IN = TCLGAD11310IN + lt113104;

            if (TCLGAD11310IN > 0) {
                lt11310tx4 = parseInt(TCLGAD11310IN * taxprc);
            }

            TCLGAD11310IN = TCLGAD11310IN + lt113105;

            if (TCLGAD11310IN > 0) {
                lt11310tx5 = parseInt(TCLGAD11310IN * taxprc);
            }
        }
    }

    // Long Term Capital Gains us 112A Charged to tax 12.5 By FII Total
    var lt12_5 = lt112A_12T;

    if (lt12_5 > tmpinc) {
        lt12_5 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - lt12_5;
    }

    var long_term_12_5 = 0;
    if (lt12_5 > 0) {
        lt112A_12Ttax = parseInt((lt12_5) * 0.125);
        if (lt112A_12Ttax < 0) {
            lt112A_12Ttax = 0;
        }

        if (forsur == false) {
            lt112A_12T1tax = 0;
            lt112A_12T2tax = 0;
            lt112A_12T3tax = 0;
            lt112A_12T4tax = 0;
            lt112A_12T5tax = 0;

            var LTCP12IN = lt112A_12T1 - long_term_12_5;
            if (LTCP12IN > 0) {
                lt112A_12T1tax = parseInt(LTCP12IN * 0.125);
            }

            LTCP12IN = LTCP12IN + lt112A_12T2;

            if (LTCP12IN > 0) {
                lt112A_12T2tax = parseInt(LTCP12IN * 0.125);
            }

            LTCP12IN = LTCP12IN + lt112A_12T3;

            if (LTCP12IN > 0) {
                lt112A_12T3tax = parseInt(LTCP12IN * 0.125);
            }

            LTCP12IN = LTCP12IN + lt112A_12T4;

            if (LTCP12IN > 0) {
                lt112A_12T4tax = parseInt(LTCP12IN * 0.125);
            }

            LTCP12IN = LTCP12IN + lt112A_12T5;

            if (LTCP12IN > 0) {
                lt112A_12T5tax = parseInt(LTCP12IN * 0.125);
            }
        }
    }

    //long term 112A
    var tlt11211 = lt11211;
    var exmpt112A = 125000;
    if (tlt11211 > tmpinc) {
        tlt11211 = tmpinc;
        tmpinc = 0;
    } else {
        tmpinc = tmpinc - tlt11211;
    }

    tnm = normalinc + tlt20 + tst15 + tst16;
    var TCLGAD11211LS = 0;
    let tlt11211_tmp = tlt11211;

    if (tlt11211 > 0) {
        if (slablimit > tnm) {
            tlt11211 = tlt11211 - (slablimit - tnm);
            if (tlt11211 < 0) {
                tlt11211 = 0;
            }
            TCLGAD11211LS = slablimit - tnm;
        }

        if (tlt11211 > exmpt112A) {
            tlt11211 = tlt11211 - exmpt112A;
            exmpt112A = 0;
        } else {
            exmpt112A = exmpt112A - tlt11211;
            tlt11211 = 0;
        }
        lt11211tax = parseInt(tlt11211 * 0.125);
        if (lt11211tax < 0) {
            lt11211tax = 0;
        }
    }

    var tst18 = lt11410;

    if (tst18 > tmpinc) {
        tst18 = tmpinc;
        tmp1 = 0;
    } else {
        tmpinc = tmpinc - tst18;
    }

    tnm = normalinc + tlt20 + tst15 + tst16 + tlt11211_tmp;
    var TCLGAD11410LS = 0;
    if (tst18 > 0) {
        if (slablimit > tnm) {
            lt11410tax = parseInt((tst18 - (slablimit - tnm)) * 0.125);
            if (lt11410tax < 0) {
                lt11410tax = 0;
            }
            TCLGAD11410LS = tnm;
        }
        else {
            lt11410tax = parseInt(tst18 * 0.125);
        }

        if (forsur == false) {
            lt11410tx1 = 0;
            lt11410tx2 = 0;
            lt11410tx3 = 0;
            lt11410tx4 = 0;
            lt11410tx5 = 0;

            var TCLGAD11410IN = lt114101 - TCLGAD11410LS;
            if (TCLGAD11410IN > 0) {
                lt11410tx1 = parseInt(TCLGAD11410IN * 0.125);
            }

            TCLGAD11410IN = TCLGAD11410IN + lt114102;

            if (TCLGAD11410IN > 0) {
                lt11410tx2 = parseInt(TCLGAD11410IN * 0.125);
            }

            TCLGAD11410IN = TCLGAD11410IN + lt114103;

            if (TCLGAD11410IN > 0) {
                lt11410tx3 = parseInt(TCLGAD11410IN * 0.125);
            }

            TCLGAD11410IN = TCLGAD11410IN + lt114104;

            if (TCLGAD11410IN > 0) {
                lt11410tx4 = parseInt(TCLGAD11410IN * 0.125);
            }

            TCLGAD11410IN = TCLGAD11410IN + lt114105;

            if (TCLGAD11410IN > 0) {
                lt11410tx5 = parseInt(TCLGAD11410IN * 0.125);
            }
        }
    }

    var tlt11210 = lt11210;
    if (tlt11210 > tmpinc) {
        tlt11210 = tmpinc;
        tmpinc = 0;
    } else {
        tmpinc = tmpinc - tlt11210;
    }
    tnm = normalinc + tlt20 + tst15 + tst16 + tlt11211_tmp + tst18;
    var TCLGAD11210LS = 0;

    if (tlt11210 > 0) {

        if (parseInt(assYr) == 2025) {
            if (slablimit > tnm) {
                tlt11210 = tlt11210 - (slablimit - tnm);
                TCLGAD11210LS = slablimit - tnm;
            }
            tlt11210 = tlt11210 - exmpt112A;
        } else {
            tlt11210 = tlt11210 - 100000;
            if (slablimit > tnm) {
                tlt11210 = tlt11210 - (slablimit - tnm);
                TCLGAD11210LS = slablimit - tnm;
            }
        }
        if (tlt11210 < 0) {
            tlt11210 = 0;
        }
        lt11210tax = parseInt(tlt11210 * 0.10);
    }

    var tlt10 = lt10;

    if (tlt10 > tmpinc) {
        tlt10 = tmpinc;
        tmpinc = 0;
    } else {
        tmpinc = tmpinc - tlt10;
    }

    tnm = normalinc + tlt20 + tst15 + tst16 + lt11410 + tlt11211_tmp + tlt11210;
    var TCLGAD10LS = 0;

    if (tlt10 > 0) {
        if (slablimit > tnm) {
            lt10tax = parseInt((tlt10 - (slablimit - tnm)) * 0.10);
            if (lt10tax < 0) {
                lt10tax = 0;
            }
            TCLGAD10LS = slablimit - tnm;
        } else {
            lt10tax = parseInt(tlt10 * 0.10);
        }

        if (forsur == false) {
            lt10tx1 = 0;
            lt10tx2 = 0;
            lt10tx3 = 0;
            lt10tx4 = 0;
            lt10tx5 = 0;

            var TCLGT10IN = lt101 - TCLGAD10LS;
            if (TCLGT10IN > 0) {
                lt10tx1 = parseInt(TCLGT10IN * 0.10);
            }

            TCLGT10IN = TCLGT10IN + lt102;
            if (TCLGT10IN > 0) {
                lt10tx2 = parseInt(TCLGT10IN * 0.10);
            }

            TCLGT10IN = TCLGT10IN + lt103;
            if (TCLGT10IN > 0) {
                lt10tx3 = parseInt(TCLGT10IN * 0.10);
            }

            TCLGT10IN = TCLGT10IN + lt104;
            if (TCLGT10IN > 0) {
                lt10tx4 = parseInt(TCLGT10IN * 0.10);
            }

            TCLGT10IN = TCLGT10IN + lt105;
            if (TCLGT10IN > 0) {
                lt10tx5 = parseInt(TCLGT10IN * 0.10);
            }
        }
    }

    if (tlt11211 > 0) {
        if (forsur == false) {
            lt11211tx1 = 0;
            lt11211tx2 = 0;
            lt11211tx3 = 0;
            lt11211tx4 = 0;
            lt11211tx5 = 0;

            if (lt112111 > tlt11211) {
                lt112111 = tlt11211;
                lt112112 = lt112113 = lt112114 = lt112115 = 0;
            }

            if ((lt112111 + lt112112) > tlt11211) {
                lt112112 = tlt11211 - lt112111;
                lt112113 = lt112114 = lt112115 = 0;
            }

            if ((lt112111 + lt112112 + lt112113) > tlt11211) {
                lt112113 = tlt11211 - lt112111 - lt112112;
                lt112114 = lt112115 = 0;
            }

            if ((lt112111 + lt112112 + lt112113 + lt112114) > tlt11211) {
                lt112114 = tlt11211 - lt112111 - lt112112 - lt112113;
                lt112115 = 0;
            }

            if ((lt112111 + lt112112 + lt112113 + lt112114 + lt112115) > tlt11211) {
                lt112115 = tlt11211 - lt112111 - lt112112 - lt112113 - lt112114;
            }

            var TCLGT11211IN = lt112111;
            if (TCLGT11211IN > 0) {
                lt11211tx1 = parseInt(TCLGT11211IN * 0.125);
            }

            TCLGT11211IN = TCLGT11211IN + lt112112;
            if (TCLGT11211IN > 0) {
                lt11211tx2 = parseInt(TCLGT11211IN * 0.125);
            }

            TCLGT11211IN = TCLGT11211IN + lt112113;
            if (TCLGT11211IN > 0) {
                lt11211tx3 = parseInt(TCLGT11211IN * 0.125);
            }

            TCLGT11211IN = TCLGT11211IN + lt112114;
            if (TCLGT11211IN > 0) {
                lt11211tx4 = parseInt(TCLGT11211IN * 0.125);
            }

            TCLGT11211IN = TCLGT11211IN + lt112115;
            if (TCLGT11211IN > 0) {
                lt11211tx5 = parseInt(TCLGT11211IN * 0.125);
            }
        }
    }

    if (tlt11210 > 0) {
        if (forsur == false) {
            lt11210tx1 = 0;
            lt11210tx2 = 0;
            lt11210tx3 = 0;
            lt11210tx4 = 0;
            lt11210tx5 = 0;

            if (lt112101 > tlt11210) {
                lt112101 = tlt11210;
                lt112102 = lt112103 = lt112104 = lt112105 = 0;
            }

            if ((lt112101 + lt112102) > tlt11210) {
                lt112102 = tlt11210 - lt112101;
                lt112103 = lt112104 = lt112105 = 0;
            }

            if ((lt112101 + lt112102 + lt112103) > tlt11210) {
                lt112103 = tlt11210 - lt112101 - lt112102;
                lt112104 = lt112105 = 0;
            }

            if ((lt112101 + lt112102 + lt112103 + lt112104) > tlt11210) {
                lt112104 = tlt11210 - lt112101 - lt112102 - lt112103;
                lt112105 = 0;
            }

            if ((lt112101 + lt112102 + lt112103 + lt112104 + lt112105) > tlt11210) {
                lt112105 = tlt11210 - lt112101 - lt112102 - lt112103 - lt112104;
            }

            var TCLGT11210IN = lt112101 - TCLGAD11210LS;
            if (TCLGT11210IN > 0) {
                lt11210tx1 = parseInt(TCLGT11210IN * 0.10);
            }

            TCLGT11210IN = TCLGT11210IN + lt112102;
            if (TCLGT11210IN > 0) {
                lt11210tx2 = parseInt(TCLGT11210IN * 0.10);
            }

            TCLGT11210IN = TCLGT11210IN + lt112103;
            if (TCLGT11210IN > 0) {
                lt11210tx3 = parseInt(TCLGT11210IN * 0.10);
            }

            TCLGT11210IN = TCLGT11210IN + lt112104;
            if (TCLGT11210IN > 0) {
                lt11210tx4 = parseInt(TCLGT11210IN * 0.10);
            }

            TCLGT11210IN = TCLGT11210IN + lt112105;
            if (TCLGT11210IN > 0) {
                lt11210tx5 = parseInt(TCLGT11210IN * 0.10);
            }
        }
    }

    //short term normal
    stnmtax = 0;
    stnmtx1 = 0;
    stnmtx2 = 0;
    stnmtx3 = 0;
    stnmtx4 = 0;
    stnmtx5 = 0;
    if (forsur == false && stnm > 0) {
        var TINCSG = normalinc - stnm;
        stnmtax = NormalIncTax(TINCSG, spinc);

        TINCSG = TINCSG + stnm1;
        stnmtx1 = NormalIncTax(TINCSG, spinc);

        TINCSG = TINCSG + stnm2;
        stnmtx2 = NormalIncTax(TINCSG, spinc);

        TINCSG = TINCSG + stnm3;
        stnmtx3 = NormalIncTax(TINCSG, spinc);

        TINCSG = TINCSG + stnm4;
        stnmtx4 = NormalIncTax(TINCSG, spinc);

        TINCSG = TINCSG + stnm5;
        stnmtx5 = NormalIncTax(TINCSG, spinc);

        stnmtx5 = zeroOrMore(stnmtx5 - stnmtx4);
        stnmtx4 = zeroOrMore(stnmtx4 - stnmtx3);
        stnmtx3 = zeroOrMore(stnmtx3 - stnmtx2);
        stnmtx2 = zeroOrMore(stnmtx2 - stnmtx1);
        stnmtx1 = zeroOrMore(stnmtx1 - stnmtax);

        stnmtax = stnmtx1 + stnmtx2 + stnmtx3 + stnmtx4 + stnmtx5;
    }

    //Dividend income Taxable at Normal rates
    dinmtax = 0;
    dinmtax1 = 0;
    dinmtax2 = 0;
    dinmtax3 = 0;
    dinmtax4 = 0;
    dinmtax5 = 0;
    if (forsur == false && dinm > 0) {
        var DINOS = normalinc - dinm;
        dinmtax = NormalIncTax(DINOS, spinc);

        DINOS = DINOS + dinm1;
        dinmtax1 = NormalIncTax(DINOS, spinc);

        DINOS = DINOS + dinm2;
        dinmtax2 = NormalIncTax(DINOS, spinc);

        DINOS = DINOS + dinm3;
        dinmtax3 = NormalIncTax(DINOS, spinc);

        DINOS = DINOS + dinm4;
        dinmtax4 = NormalIncTax(DINOS, spinc);

        DINOS = DINOS + dinm5;
        dinmtax5 = NormalIncTax(DINOS, spinc);

        dinmtax5 = zeroOrMore(dinmtax5 - dinmtax4);
        dinmtax4 = zeroOrMore(dinmtax4 - dinmtax3);
        dinmtax3 = zeroOrMore(dinmtax3 - dinmtax2);
        dinmtax2 = zeroOrMore(dinmtax2 - dinmtax1);
        dinmtax1 = zeroOrMore(dinmtax1 - dinmtax);

        dinmtax = dinmtax1 + dinmtax2 + dinmtax3 + dinmtax4 + dinmtax5;
    }

    cg112and111ATax = st15tax + lt30tax + lt40tax + lt20tax + lt11210tax + lt11211tax + lt11310tax + lt112A_12Ttax + lt11410tax;

    return (lotteryTax + lt20tax + lt30tax + lt40tax + st15tax + lt10tax + lt11210tax + lt11310tax + lt11410tax + lt11211tax + interest_taxable5tax + interest_taxable_5_115Atax + interest_taxable_4_115APtax + interest_taxable_9_6b_Ntax + interest_taxable_10_115ACtax + interest_Taxable_20115A_115Etax + interest_Taxable_20_115ADtax + interest_Taxable_10_210_6e_Ntax + interest_Taxable_10_208_6f_Ntax + income_chargeable60115BBEtax + income_chargeable115BBF_10tax + income_chargeable115BBG_10tax + income_chargeable115BBAtax + income_from_royalty10tax + dividend115AC10tax + dividend115ACA_10tax + dividend115A_20tax + dividend115_AD_20tax + dividend210_10tax + dividend208_10tax + recognised_provident_fund_taxable_6jtax + onlineGame115BBJtax + lt112A_12Ttax);
}

var NormalIncTax = function (tmpinc, spinc) {
    var ttx = 0;
    if (cStatus == "IND" || cStatus == "HUF") {
        if (oldnewslab == "old") {
            ttx = TaxIndOld(slablimitorg, tmpinc);
        } else {
            ttx = TaxIndNew(slablimitorg, tmpinc);
        }
    } else if (cStatus == "AOP") {
        if (oldnewslab == "old") {
            ttx = TaxIndOld(slablimitorg, tmpinc);
        } else {
            ttx = TaxIndNew(slablimitorg, tmpinc);
        }
    } else if (cStatus == "FIRM" || cStatus == "LLP") {
        ttx = parseInt((tmpinc) * 0.30);
    } else if (cStatus == "COMPD") {
        ttx = parseInt((tmpinc) * 0.30);
    } else if (cStatus == "COMPF") {
        ttx = parseInt((tmpinc) * 0.40);
    } else if (cStatus == "TRUST") {
        ttx = parseInt((tmpinc) * 0.30);
    } else if (cStatus == "COOP") {
        ttx = TaxCoop(tmpinc);
    } else if (cStatus == "COOP115BAD") {
        ttx = parseInt((tmpinc));
    } else if (cStatus == "COOP115BAE") {
        ttx = parseInt((tmpinc));
    }

    return ttx;
}

//Get Slab limit 
var TaxLimit = function (assYr, cStatus, age, rstatus, slab = "old") {
    if (slab == 'new') {
        if (assYr >= "2026") {
            var tlim = 400000;
            return tlim;
        } else if ((assYr == "2024") || (assYr == "2025")) {
            var tlim = 300000;
            return tlim;
        } else {
            var tlim = 250000;
            return tlim;
        }
    }
    else {
        var tlim = 0;
        if (rstatus == "NR") {
            tlim = 250000;
        } else if (age == "SSR") {
            tlim = 500000;
        } else if (age == "SR") {
            tlim = 300000;
        } else {
            tlim = 250000;
        }

        if (cStatus != "IND") {
            tlim = 250000;
        }

        return tlim;
    }

}

//Tax on Individual with old slab
var TaxIndOld = function (tclimit, tinc) {
    var tax = 0;
    if (cStatus == 'IND' && (rstatus == 'R' || rstatus == 'NOR') && age == 'SR') {
        if (tinc <= tclimit) {
            tax = 0;
        } else if (tinc <= 500000) {
            tax = (tinc - tclimit) * 0.05;
        } else if (tinc <= 1000000) {
            tax = ((tinc - 500000) * 0.2) + 10000;
        } else {
            tax = ((tinc - 1000000) * 0.3) + 110000;
        }
    } else if (cStatus == 'IND' && (rstatus == 'R' || rstatus == 'NOR') && age == 'SSR') {
        if (tinc <= tclimit) {
            tax = 0;
        } else if (tinc <= 1000000) {
            tax = ((tinc - tclimit) * 0.2);
        } else {
            tax = ((tinc - 1000000) * 0.3) + 100000;
        }
    } else if ((cStatus == 'IND' || cStatus == 'HUF') && (rstatus == 'R' || rstatus == 'NOR' || rstatus == 'NR')) {
        if (tinc <= tclimit) {
            tax = 0;
        } else if (tinc <= 500000) {
            tax = (tinc - tclimit) * 0.05;
        } else if (tinc <= 1000000) {
            tax = ((tinc - 500000) * 0.2) + 12500;
        } else {
            tax = ((tinc - 1000000) * 0.3) + 112500;
        }
    } else if (cStatus == 'COOP') {
        tax = TaxCoop(tinc);
    } else if (cStatus == 'COOP115BAD') {
        tax = tinc * 0.22;
    } else if (cStatus == 'COOP115BAE') {
        var tax1, tax2, manufacturInc = 0
        manufacturInc = incomeManuf_Busnss;
        if (manufacturInc > 0) {
            tax1 = parseInt((manufacturInc) * 0.15);
        }
        tax2 = parseInt((tinc) * 0.22);
        tax = tax1 + tax2;
    } else if (cStatus == "COMPF") {
        if (parseInt(assYr) >= 2025) {
            tax = parseInt((tinc) * 0.35);
        } else {
            tax = parseInt((tinc) * 0.40);
        }
    } else if (cStatus == "TRUST") {
        tax = parseInt((tinc) * 0.30);
    } else if (cStatus == "COMPD") {
        tax = parseInt((tinc) * 0.30);
    } else if (cStatus == "FIRM" || cStatus == "LLP") {
        tax = parseInt((tinc) * 0.30);
    } else {
        if (tinc < 250000) {
            tax = 0;
        } else if (tinc <= 500000) {
            tax = (tinc - tclimit) * 0.05;
        } else if (tinc < 1000000) {
            if (tclimit == 250000) {
                tax = ((tinc - 500000) * 0.2) + 12500;
            } else if (tclimit == 300000) {
                tax = ((tinc - 500000) * 0.2) + 10000;
            } else if (tclimit == 500000) {
                tax = ((tinc - 500000) * 0.2);
            }
        } else {
            if (tclimit == 250000) {
                tax = ((tinc - 1000000) * 0.3) + 112500;
            } else if (tclimit == 300000) {
                tax = ((tinc - 1000000) * 0.3) + 110000;
            } else if (tclimit == 500000) {
                tax = ((tinc - 1000000) * 0.3) + 100000;
            }
        }
    }

    if (tax < 0) {
        tax = 0;
    }

    return parseInt(tax);
}

//Tax on Individual with new slab option
var TaxIndNew = function (tclimit, tinc) {
    var tax = 0;
    if (parseInt(assYr) >= 2026) {
        if (tinc < 400000) {
            tax = 0;
        } else if (tinc <= 800000) {
            tax = (tinc - 400000) * 0.05;
        } else if (tinc <= 1200000) {
            tax = (tinc - 800000) * 0.10 + 20000;
        } else if (tinc < 1600000) {
            tax = (tinc - 1200000) * 0.15 + 60000;
        } else if (tinc < 2000000) {
            tax = (tinc - 1600000) * 0.20 + 120000;
        } else if (tinc < 2400000) {
            tax = (tinc - 2000000) * 0.25 + 200000;
        } else if (tinc < 5000000) {
            tax = (tinc - 2400000) * 0.30 + 300000;
        } else if (tinc < 10000000) {
            tax = (tinc - 5000000) * 0.30 + 1080000;
        } else if (tinc < 20000000) {
            tax = (tinc - 10000000) * 0.30 + 2580000;
        } else {
            tax = (tinc - 20000000) * 0.30 + 5580000;
        }
    } else if (parseInt(assYr) == 2025) {
        if (tinc < 300000) {
            tax = 0;
        } else if (tinc <= 700000) {
            tax = (tinc - tclimit) * 0.05;
        } else if (tinc <= 1000000) {
            tax = (tinc - 700000) * 0.10 + 20000;
        } else if (tinc < 1200000) {
            tax = (tinc - 1000000) * 0.15 + 50000;
        } else if (tinc < 1500000) {
            tax = (tinc - 1200000) * 0.20 + 80000;
        } else if (tinc < 5000000) {
            tax = (tinc - 1500000) * 0.30 + 140000;
        } else if (tinc < 10000000) {
            tax = (tinc - 5000000) * 0.30 + 1190000;
        } else if (tinc < 20000000) {
            tax = (tinc - 10000000) * 0.30 + 2690000;
        } else {
            tax = (tinc - 20000000) * 0.30 + 5690000;
        }
    } else if (parseInt(assYr) == "2024") {
        if (tinc < 300000) {
            tax = 0;
        } else if (tinc <= 600000) {
            tax = (tinc - tclimit) * 0.05;
        } else if (tinc <= 900000) {
            tax = (tinc - 600000) * 0.10 + 15000;
        } else if (tinc < 1200000) {
            tax = (tinc - 900000) * 0.15 + 45000;
        } else if (tinc < 1500000) {
            tax = (tinc - 1200000) * 0.20 + 90000;
        } else if (tinc < 5000000) {
            tax = (tinc - 1500000) * 0.30 + 150000;
        } else if (tinc < 10000000) {
            tax = (tinc - 5000000) * 0.30 + 1200000;
        } else if (tinc < 20000000) {
            tax = (tinc - 10000000) * 0.30 + 2700000;
        } else {
            tax = (tinc - 20000000) * 0.30 + 5700000;
        }
    } else {
        if (tinc < 250000) {
            tax = 0;
        } else if (tinc <= 500000) {
            tax = (tinc - tclimit) * 0.05;
        } else if (tinc <= 750000) {
            tax = (tinc - 500000) * 0.10 + 12500;
        } else if (tinc < 1000000) {
            tax = (tinc - 750000) * 0.15 + 37500;
        } else if (tinc < 1250000) {
            tax = (tinc - 1000000) * 0.20 + 75000;
        } else if (tinc < 1500000) {
            tax = (tinc - 1250000) * 0.25 + 125000;
        } else {
            tax = (tinc - 1500000) * 0.30 + 187500;
        }
    }

    if (tax < 0) {
        tax = 0;
    }

    return parseInt(tax);
}
//Rebate Calculation
var RebateCalculation = function (taxbleIncome, tax, taxRegime, taxAssYr, residentialStatus, categoryStatus, ageGroup) {
    let rebate = 0;
    if (taxbleIncome <= 500000 && residentialStatus != "NR" && taxRegime == 'old' && (categoryStatus == "IND" && ageGroup == 'NM')) {
        rebate = 12500;
        if (rebate > tax) {
            rebate = tax;
        }
    } else if (taxbleIncome <= 500000 && residentialStatus != "NR" && categoryStatus == "IND" && (ageGroup == 'SR' || ageGroup == 'SSR') && taxRegime == 'old') {
        rebate = 12500;
        if (rebate > tax) {
            rebate = tax;
        }
    } else if (taxbleIncome <= 1200000 && residentialStatus != "NR" && categoryStatus == "IND" && taxRegime == 'new' && taxAssYr >= '2026') {
        if (taxbleIncome <= 800000) {
            rebate = 20000;
            if (rebate > tax) {
                rebate = tax;
            }
            if (taxbleIncome > 800000) {
                rebate = 0;
            }
        } else if (taxbleIncome <= 1200000) {
            rebate = 60000;
            if (rebate > tax) {
                rebate = tax;
            }
            if (taxbleIncome > 1200000) {
                rebate = 0;
            }
        }
    } else if (taxbleIncome <= 600000 && residentialStatus != "NR" && categoryStatus == "IND" && taxRegime == 'new' && taxAssYr >= '2024') {
        rebate = 15000;
        if (rebate > tax) {
            rebate = tax;
        }
    } else if (taxbleIncome <= 700000 && residentialStatus != "NR" && categoryStatus == "IND" && taxRegime == 'new' && taxAssYr >= '2025') {
        rebate = 20000;
        if (rebate > tax) {
            rebate = tax;
        }
        if (taxbleIncome > 700000) {
            rebate = 0;
        }
    }
    else if (taxbleIncome <= 900000 && residentialStatus != "NR" && categoryStatus == "IND" && taxRegime == 'new' && taxAssYr >= '2024') {
        rebate = 25000;
        if (rebate > tax) {
            rebate = tax;
        }

        if (taxbleIncome > 700000) {
            rebate = 0;
        }
    } else if (taxbleIncome <= 500000 && residentialStatus != "NR" && (categoryStatus == "IND" || categoryStatus == "HUF") && taxRegime == 'new' && taxAssYr < '2024') {
        rebate = 12500;
        if (rebate > tax) {
            rebate = tax;
        }
    }

    // TY 
    if (taxbleIncome <= 1200000 && residentialStatus != "NR" && categoryStatus == "IND" && taxRegime == 'new' && taxAssYr >= '2027') {
        rebate = 60000;
        if (rebate > tax) {
            rebate = tax;
        }
    }

    return rebate;
}

//Surcharge calculation
var SurChargeCalculation = function (taxbleIncome, tax, taxRegime, taxAssYr, categoryStatus, ageGroup, residentialStatus) {
    let surc = 0;
    if (taxRegime == 'old') {
        if (taxbleIncome > 5000000 && taxbleIncome <= 10000000) {
            surc = parseInt((tax * 10) / 100);
        } else if (taxbleIncome > 10000000 && taxbleIncome <= 20000000) {
            surc = parseInt((tax * 15) / 100);
        } else if (taxbleIncome > 20000000 && taxbleIncome <= 50000000) {
            surc = parseInt((tax * 25) / 100);
        } else if (taxbleIncome > 50000000) {
            surc = parseInt((tax * 37) / 100);
        } else {
            surc = 0;
        }
    } else if (taxRegime == 'new') {
        if (taxAssYr >= '2024') {
            if (taxbleIncome > 5000000 && taxbleIncome <= 10000000) {
                surc = parseInt((tax * 10) / 100);
            } else if (taxbleIncome > 10000000 && taxbleIncome <= 20000000) {
                surc = parseInt((tax * 15) / 100);
            } else if (taxbleIncome > 20000000) {
                surc = parseInt((tax * 25) / 100);
            } else {
                surc = 0;
            }
        } else {
            if (taxbleIncome > 5000000 && taxbleIncome <= 10000000) {
                surc = parseInt((tax * 10) / 100);
            } else if (taxbleIncome > 10000000 && taxbleIncome <= 20000000) {
                surc = parseInt((tax * 15) / 100);
            } else if (taxbleIncome > 20000000 && taxbleIncome <= 50000000) {
                surc = parseInt((tax * 25) / 100);
            } else if (taxbleIncome > 50000000) {
                surc = parseInt((tax * 37) / 100);
            } else {
                surc = 0;
            }
        }
    }
    if (taxbleIncome > 5000000 && taxbleIncome < 5200000) {
        const thresholdIncome = 5000000;
        const thresholdLimit = TaxLimit(taxAssYr, categoryStatus, ageGroup, residentialStatus, taxRegime);
        const thresholdTax = taxRegime == 'old' ? TaxIndOld(thresholdLimit, thresholdIncome) : TaxIndNew(thresholdLimit, thresholdIncome);
        const marginalReliefSurcharge = thresholdTax + (taxbleIncome - thresholdIncome) - tax;
        if (marginalReliefSurcharge < surc) {
            surc = marginalReliefSurcharge;
        }
        if (surc < 0) {
            surc = 0;
        }
    }
    return surc;
}

//Tax on Cooperative society
var TaxCoop = function (ttinc) {
    var tax = 0;
    if (ttinc <= 10000) {
        tax = parseInt(ttinc * 0.10);
    } else if (ttinc > 10000 && ttinc <= 20000) {
        tax = parseInt((ttinc - 10000) * 0.20) + 1000;
    } else if (ttinc <= 10000000) {
        tax = parseInt((ttinc - 20000) * 0.30) + 3000;
    } else if (ttinc <= 100000000) {
        tax = parseInt((ttinc - 10000000) * 0.30) + 2997000;
    } else if (ttinc >= 100000000) {
        tax = parseInt((ttinc - 100000000) * 0.30) + 29997000;
    }

    if (tax < 0) {
        tax = 0;
    }

    return parseInt(tax);
}

//Tax on company status 
var TaxComp = function (ttinc, cStatus) {
    var tax = 0;
    if (cStatus === "COMPD") {
        tax = parseInt(ttinc * 0.30);
    } else {
        if (parseInt(assYr) >= 2025) {
            tax = parseInt(ttinc * 0.35);
        } else {
            tax = parseInt(ttinc * 0.40);
        }
    }

    if (tax < 0) {
        tax = 0;
    }

    return parseInt(tax);
}

//date in dd/MM/yyyy format
var calcNoOfMonths = function (currentDate, startDate) {
    if (currentDate == undefined || currentDate == '' || startDate == undefined || startDate == '') {
        return 0;
    }

    var currentYear = currentDate.substring(6, 10); var startYear = startDate.substring(6, 10);
    var currentMonth = currentDate.substring(3, 5); var startMonth = startDate.substring(3, 5);
    var noOfMonths = parseInt('0', 10);

    if (currentYear == startYear && currentMonth == startMonth &&
        currentDate.substring(0, 2) == startDate.substring(0, 2)) {
        noOfMonths = parseInt('1', 20);
    } else if (checkFirstDateBefore(currentDate, startDate)) {
        noOfMonths = parseInt('0', 20);
    } else {
        if (parseInt(currentYear, 10) == (parseInt(startYear, 10) + parseInt('1', 10))) {
            if (parseInt(currentMonth, 10) < parseInt(startMonth, 10)) {
                noOfMonths = parseInt('12', 10) - (parseInt(startMonth, 10) - parseInt(currentMonth, 10)) + parseInt('1', 10);
            } else {
                noOfMonths = parseInt('12', 10) + (parseInt(currentMonth, 10) - parseInt(startMonth, 10)) + parseInt('1', 10);
            }
        } else if (parseInt(currentYear, 10) == parseInt(startYear, 10)) {
            noOfMonths = parseInt(currentMonth, 10) - parseInt(startMonth, 10) + parseInt('1', 10);
        } else {
            if (parseInt(currentMonth, 10) < parseInt(startMonth, 10)) {
                noOfMonths = Math.round(((parseInt(currentYear, 10) - parseInt(startYear, 10) - parseInt('1', 10)) * parseInt('12', 10))) + parseInt('12', 10) - parseInt(startMonth, 10) + parseInt(currentMonth, 10) + parseInt('1', 10);
            } else if (parseInt(currentMonth, 10) > parseInt(startMonth, 10)) {
                noOfMonths = Math.round(((parseInt(currentYear, 10) - parseInt(startYear, 10)) * parseInt('12', 10))) + parseInt(currentMonth, 10) - parseInt(startMonth, 10) + parseInt('1', 10);
            } else {
                noOfMonths = Math.round(((parseInt(currentYear, 10) - parseInt(startYear, 10)) * parseInt('12', 10))) + parseInt('1', 10);
            }
        }
    }
    return noOfMonths;
}

function checkFirstDateBefore(firstDate, secondDate) {
    if (firstDate == undefined || firstDate == '' || secondDate == undefined || secondDate == '') {
        return false;
    }

    if (parseInt(firstDate.substring(6, 10)) < parseInt(secondDate.substring(6, 10))) {
        return true;
    }
    else if (parseInt(firstDate.substring(6, 10)) == parseInt(secondDate.substring(6, 10))) {
        if (parseInt(firstDate.substring(3, 5)) < parseInt(secondDate.substring(3, 5))) {
            return true;
        }
        else if (parseInt(firstDate.substring(3, 5)) == parseInt(secondDate.substring(3, 5))) {
            if (parseInt(firstDate.substring(0, 2)) < parseInt(secondDate.substring(0, 2))) {
                return true;
            }
            else if (parseInt(firstDate.substring(0, 2)) == parseInt(secondDate.substring(0, 2))) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}

function coalesce(value) {
    if (isNaN(value) || value == '' || value == null) {
        value = '0';
    }
    return parseInt(value, 10);
}

function zeroOrMore(val) {
    val = coalesce(val);
    if (val < 0) {
        return 0;
    }
    return val;
}

//To calculate Advanced Tax 234A section
function calculateAdvancedTax234A(dueDate, js) {
    var advanceTax = parseInt('0', 10);
    if (js.paymentdetails != undefined && js.paymentdetails != null) {
        $.each(js.paymentdetails, function (k, data) {
            dt1 = getDate(new Date(data.paydate));
            if (checkFirstDateBefore(AyStDt, dt1) && checkFirstDateBefore(dt1, dueDate)) {
                advanceTax = parseInt(parseInt(coalesce(advanceTax), 10) + parseInt(coalesce(data.payamount), 10));
            }
        });
    }
    return advanceTax;
}

var getDate = function (dtobj) {
    var retdt = '';
    if (dtobj != undefined && dtobj != '') {
        if (dtobj._isAMomentObject != undefined && dtobj._isAMomentObject == true) {
            retdt = getfulldate(dtobj.date(), dtobj.month(), dtobj.year());
        } else {
            retdt = getfulldate(dtobj.getDate(), dtobj.getMonth(), dtobj.getFullYear());
        }
    }
    return retdt;
}

var getfulldate = function (dd, mm, yy) {
    mm = mm + 1;
    var mmstr = '';
    var ddstr = '';
    var dtstr = "";
    if (mm < 10) {
        mmstr = '0' + String(mm);
    } else {
        mmstr = mm + "";
    }
    if (dd < 10) {
        ddstr = '0' + String(dd);
    } else {
        ddstr = String(dd);
    }
    dtstr = ddstr + "/" + mmstr + "/" + String(yy);
    return dtstr;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//starting point of calculation, js is json object contains all input values.
function doCalculation(js) {
    if (js.calcType == undefined || js.calcType == null) {
        alert("Invalid parameters.");
        return;
    }

    var rstatus = "R";
    if (js.rstatus == "NR" || js.rstatus == "NOR") {
        rstatus = js.rstatus;
    }

    assYr = js.assYr.substring(0, 4);
    age = js.age;
    if (js.calcType == "basic") {
        jsret = ItdCalc.BasicCal.GetTaxCal(js.assYr.substring(0, 4), js.cStatus, js.age, rstatus, coalesce(js.tinc), coalesce(js.ded), coalesce(js.total_taxable_incm_nw), coalesce(js.deductions_allowed_old_regime), coalesce(js.exemptions_allowed_old_regime));
        js.TaxOld = jsret.TaxOld;
        js.TaxNew = jsret.TaxNew;
        js.TaxMsg = jsret.TaxMsg;
    }
    else {
        jsret = ItdCalc.AdvCalc.GetTaxCal(js);
    }
}
