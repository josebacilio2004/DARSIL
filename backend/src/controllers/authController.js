const User = require('../models/User');

const MASTER_USER = {
  name: 'Darios Bacilio',
  username: 'darios',
  email: 'darios.bacilio@darsil.com',
  role: 'ADMIN_DARSIL'
};
const MASTER_PASSWORD = 'Darsil#2026*Titanium';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contrase単a requeridos' });
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Verificaci坦n con Master Credentials (Fail-safe para alta disponibilidad)
    if (
      (cleanUser === 'darios' || cleanUser === 'darios.bacilio' || cleanUser === 'darios@darsil.com' || cleanUser === 'dariosbacilio') &&
      cleanPass === MASTER_PASSWORD
    ) {
      // Sincronizar o crear en base de datos si est叩 disponible
      try {
        let dbUser = await User.findOne({ username: 'darios' });
        if (!dbUser) {
          dbUser = new User({
            name: MASTER_USER.name,
            username: MASTER_USER.username,
            email: MASTER_USER.email,
            role: 'ADMIN'
          });
          dbUser.setPassword(MASTER_PASSWORD);
        }
        dbUser.lastLogin = new Date();
        await dbUser.save();
      } catch (e) {
        console.warn('Nota: Inicio de sesi坦n master completado (BD sincroniz叩ndose):', e.message);
      }

      return res.json({
        success: true,
        message: 'Acceso autorizado al ERP DARSIL',
        token: `darsil_auth_${Date.now()}_secure`,
        user: {
          name: MASTER_USER.name,
          username: MASTER_USER.username,
          email: MASTER_USER.email,
          role: 'ADMINISTRADOR GENERAL'
        }
      });
    }

    // 2. Verificaci坦n est叩ndar en MongoDB
    const user = await User.findOne({
      $or: [{ username: cleanUser }, { email: cleanUser }]
    });

    if (!user || !user.validatePassword(cleanPass)) {
      return res.status(401).json({ success: false, message: 'Credenciales inv叩lidas. Verifique usuario y contrase単a.' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Usuario inactivo. Contacte a soporte t谷cnico.' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Bienvenido al ERP DARSIL',
      token: `darsil_token_${user._id}_${Date.now()}`,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: MASTER_USER
  });
};
