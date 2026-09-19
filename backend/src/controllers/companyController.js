const CompanyConfig = require('../models/CompanyConfig');

exports.getCompanyConfig = async (req, res) => {
  try {
    let config = await CompanyConfig.findOne();
    if (!config) {
      config = await CompanyConfig.create({});
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCompanyConfig = async (req, res) => {
  try {
    let config = await CompanyConfig.findOne();
    if (!config) {
      config = await CompanyConfig.create(req.body);
    } else {
      Object.assign(config, req.body);
      await config.save();
    }
    res.json({ success: true, message: 'Configuración actualizada exitosamente', data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// CRUD de Cuentas Bancarias
exports.addBankAccount = async (req, res) => {
  try {
    const { bank, accountType, accountNumber, interbankAccount } = req.body;
    if (!bank || !accountNumber || !interbankAccount) {
      return res.status(400).json({ success: false, message: 'Banco, N° cuenta y CCI son obligatorios' });
    }

    let config = await CompanyConfig.findOne();
    if (!config) config = await CompanyConfig.create({});

    config.bankAccounts.push({
      bank: bank.toUpperCase().trim(),
      accountType: accountType || 'CTA CTE',
      accountNumber: accountNumber.trim(),
      interbankAccount: interbankAccount.trim()
    });

    await config.save();
    res.status(201).json({ success: true, message: 'Cuenta bancaria agregada', data: config.bankAccounts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { bank, accountType, accountNumber, interbankAccount } = req.body;

    let config = await CompanyConfig.findOne();
    if (!config) return res.status(404).json({ success: false, message: 'Configuración no encontrada' });

    const account = config.bankAccounts.id(accountId);
    if (!account) return res.status(404).json({ success: false, message: 'Cuenta bancaria no encontrada' });

    if (bank) account.bank = bank.toUpperCase().trim();
    if (accountType) account.accountType = accountType;
    if (accountNumber) account.accountNumber = accountNumber.trim();
    if (interbankAccount) account.interbankAccount = interbankAccount.trim();

    await config.save();
    res.json({ success: true, message: 'Cuenta bancaria actualizada', data: config.bankAccounts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    let config = await CompanyConfig.findOne();
    if (!config) return res.status(404).json({ success: false, message: 'Configuración no encontrada' });

    config.bankAccounts = config.bankAccounts.filter(acc => acc._id.toString() !== accountId);
    await config.save();

    res.json({ success: true, message: 'Cuenta bancaria eliminada', data: config.bankAccounts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
