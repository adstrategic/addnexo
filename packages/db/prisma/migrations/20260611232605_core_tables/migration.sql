-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "business";

-- CreateEnum
CREATE TYPE "business"."TipoPropositoMovkar" AS ENUM ('DISPATCH_ORDER', 'DISPATCH_ORDER_DEVOLUCION', 'DISPATCH_ORDER_ANULACION', 'FACTURA_DEVOLUCION', 'NOTA_CREDITO', 'NOTA_CREDITO_CON_DEVOLUCION', 'NOTA_DEBITO', 'ABONO');

-- CreateEnum
CREATE TYPE "business"."RegistroInvitacionModulo" AS ENUM ('CLIENTE', 'PROVEEDOR', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "business"."EstadoDispatchOrder" AS ENUM ('DRAFT', 'EMITTED', 'INVOICED', 'DISPATCHED', 'ANULATED');

-- CreateEnum
CREATE TYPE "business"."EstadoReserva" AS ENUM ('ACTIVE', 'EXPIRED', 'RELEASED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "business"."ModoSalida" AS ENUM ('MANUAL', 'AUTOMATICO');

-- CreateEnum
CREATE TYPE "business"."DocumentType" AS ENUM ('DISPATCH_ORDER', 'PURCHASE_ORDER', 'INVOICE');

-- CreateEnum
CREATE TYPE "business"."OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "business"."OutboxEventType" AS ENUM ('INVOICE_CREATED', 'DISPATCH_ORDER_EMITTED');

-- CreateEnum
CREATE TYPE "business"."AggregateType" AS ENUM ('FACTURA', 'DISPATCH_ORDER');

-- CreateEnum
CREATE TYPE "business"."EstadoFactura" AS ENUM ('ACTIVE', 'PAID', 'OVERDUE', 'ANULATED');

-- CreateEnum
CREATE TYPE "business"."TipoPago" AS ENUM ('CONTADO', 'CANJE', 'CREDITO', 'WALLET', 'CREDIT_CARD', 'TRANSFER', 'CHECK');

-- CreateTable
CREATE TABLE "auth"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."paises" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."estados" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT,
    "paisId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."ciudades" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT,
    "estadoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."organization_ciudad" (
    "organizationId" TEXT NOT NULL,
    "ciudadId" INTEGER NOT NULL,

    CONSTRAINT "organization_ciudad_pkey" PRIMARY KEY ("organizationId","ciudadId")
);

-- CreateTable
CREATE TABLE "business"."acumulados_pais" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paisId" INTEGER NOT NULL,
    "mes" SMALLINT NOT NULL,
    "ano" SMALLINT NOT NULL,
    "acumuladoCompras" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acumulados_pais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."acumulados_estado" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "estadoId" INTEGER NOT NULL,
    "mes" SMALLINT NOT NULL,
    "ano" SMALLINT NOT NULL,
    "acumuladoCompras" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acumulados_estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."acumulados_ciudad" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ciudadId" INTEGER NOT NULL,
    "mes" SMALLINT NOT NULL,
    "ano" SMALLINT NOT NULL,
    "acumuladoCompras" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acumulados_ciudad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."unidades_medida" (
    "UMId" SERIAL NOT NULL,
    "UMOrganizationId" TEXT NOT NULL,
    "UMNombre" TEXT NOT NULL,
    "UMDescripcion" VARCHAR(30) NOT NULL,
    "UMOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("UMId")
);

-- CreateTable
CREATE TABLE "business"."clases_almacen" (
    "CAId" SERIAL NOT NULL,
    "CAOrganizationId" TEXT NOT NULL,
    "CACodigo" VARCHAR(1) NOT NULL,
    "CADescripcion" VARCHAR(20) NOT NULL,

    CONSTRAINT "clases_almacen_pkey" PRIMARY KEY ("CAId")
);

-- CreateTable
CREATE TABLE "business"."almacenes" (
    "ALId" SERIAL NOT NULL,
    "ALOrganizationId" TEXT NOT NULL,
    "ALCiudadId" INTEGER NOT NULL,
    "ALNombre" TEXT NOT NULL,
    "ALResponsable" TEXT NOT NULL,
    "ALDireccion" TEXT NOT NULL,
    "ALTelefono" TEXT NOT NULL,
    "ALCuentaContable" TEXT NOT NULL DEFAULT '',
    "ALOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT NOT NULL,

    CONSTRAINT "almacenes_pkey" PRIMARY KEY ("ALId")
);

-- CreateTable
CREATE TABLE "business"."pedidos_sucursal" (
    "PSId" SERIAL NOT NULL,
    "PSOrganizationId" TEXT NOT NULL,
    "PSAlmacenId" INTEGER NOT NULL,
    "PSInvcaruniId" INTEGER NOT NULL,
    "PSCantidadPedida" DECIMAL(65,30) NOT NULL,
    "PSCantidadEntregada" DECIMAL(65,30) NOT NULL,
    "PSValorUnitario" DECIMAL(11,3) NOT NULL,
    "PSAProbado" BOOLEAN NOT NULL,
    "PSPedido" VARCHAR(5) NOT NULL,
    "PSFechaPedido" DATE NOT NULL,
    "PSFechaUltimaEntrega" DATE NOT NULL,
    "PSOrgSecuencia" INTEGER NOT NULL,

    CONSTRAINT "pedidos_sucursal_pkey" PRIMARY KEY ("PSId")
);

-- CreateTable
CREATE TABLE "business"."invcaruni" (
    "CKId" SERIAL NOT NULL,
    "CKGrupoId" INTEGER NOT NULL,
    "CKOrganizationId" TEXT NOT NULL,
    "CKUnidadMedidaId" INTEGER NOT NULL,
    "CKCodigo" INTEGER NOT NULL,
    "CKDescripcion" VARCHAR(40) NOT NULL,
    "CKOrigenId" INTEGER NOT NULL,
    "CKPrecioPublico" DECIMAL(9,2) NOT NULL,
    "CKPrecioVenta1" DECIMAL(9,2) NOT NULL,
    "CKPrecioVenta2" DECIMAL(9,2) NOT NULL,
    "CKPorcenMargen" DECIMAL(4,2) NOT NULL,
    "CKPorcenMargenTopeDesc" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "CKTopeDescuento" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "CKIva" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "CKPesoPromedioKg" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "CKExento" BOOLEAN NOT NULL DEFAULT false,
    "CKOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "invcaruni_pkey" PRIMARY KEY ("CKId")
);

-- CreateTable
CREATE TABLE "business"."grupos" (
    "GId" SERIAL NOT NULL,
    "GOrganizationId" TEXT NOT NULL,
    "GNro" INTEGER NOT NULL,
    "GDescripcion" VARCHAR(30) NOT NULL,
    "GOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("GId")
);

-- CreateTable
CREATE TABLE "business"."kardex" (
    "KId" SERIAL NOT NULL,
    "KInvcaruniId" INTEGER NOT NULL,
    "KOrganizationId" TEXT NOT NULL,
    "KAlmacenId" INTEGER NOT NULL,
    "KExistenciaInicial" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KEntradas" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "KValorEntradas" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KSalidas" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "KValorSalidas" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KExistenciaFin" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KCostoUltimo" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KCostoPromedio" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLValorCostoUltimo" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLValorCostoPromedio" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KFechaUltimoConteo" DATE,
    "KUltimoConteo" DECIMAL(9,2) DEFAULT 0,
    "KMes" SMALLINT NOT NULL,
    "KAno" SMALLINT NOT NULL,
    "KExistenciaMin" INTEGER NOT NULL DEFAULT 0,
    "KExistenciaMax" INTEGER NOT NULL DEFAULT 0,
    "KTiempoReposicion" INTEGER NOT NULL DEFAULT 0,
    "KNroTarjeta" VARCHAR(6) NOT NULL,
    "KUltimoDetalle" VARCHAR(20) NOT NULL,
    "KOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "kardex_pkey" PRIMARY KEY ("KId")
);

-- CreateTable
CREATE TABLE "business"."kardex_lote" (
    "KLId" SERIAL NOT NULL,
    "KLKardexId" INTEGER NOT NULL,
    "KLCiudadId" INTEGER NOT NULL,
    "KLOrganizationId" TEXT NOT NULL,
    "KLInvcaruniId" INTEGER NOT NULL,
    "KAlmacenId" INTEGER NOT NULL,
    "KLLote" TEXT NOT NULL,
    "KLNroDocumento" VARCHAR(50) NOT NULL,
    "KLExistenciaInicial" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLEntradas" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "KLValorEntradas" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLSalidas" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "KLValorSalidas" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLExistenciaFin" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLCostoUltimo" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLCostoPromedio" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLValorCostoUltimo" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLValorCostoPromedio" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KLFechaUltimaEntrada" DATE,
    "KLFechaUltimoConteo" DATE,
    "KLUltimoConteo" DECIMAL(9,2) DEFAULT 0,
    "KLMes" SMALLINT NOT NULL,
    "KLAno" SMALLINT NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "kardex_lote_pkey" PRIMARY KEY ("KLId")
);

-- CreateTable
CREATE TABLE "business"."kardex_det" (
    "KDId" SERIAL NOT NULL,
    "KDKardexLoteId" INTEGER NOT NULL,
    "KDOrganizationId" TEXT NOT NULL,
    "KDAlmacenId" INTEGER NOT NULL,
    "KDInvcaruniId" INTEGER NOT NULL,
    "KDCiudadId" INTEGER NOT NULL,
    "KDLote" TEXT NOT NULL,
    "KDFecha" DATE NOT NULL,
    "KDExistenciaInicial" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KDEntradas" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "KDValorEntradas" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KDSalidas" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "KDValorSalidas" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KDExistenciaFin" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KDCostoUltimo" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KDCostoPromedio" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "KDMes" SMALLINT NOT NULL,
    "KDAno" SMALLINT NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "kardex_det_pkey" PRIMARY KEY ("KDId")
);

-- CreateTable
CREATE TABLE "business"."movkar" (
    "MVId" SERIAL NOT NULL,
    "MVKardexDetId" INTEGER NOT NULL,
    "MVTipoMovimientoId" INTEGER NOT NULL,
    "MVLote" TEXT NOT NULL,
    "MVLoteNroDocumento" TEXT NOT NULL,
    "MVProveedorId" INTEGER,
    "MVClienteId" INTEGER,
    "MVAlmacenId" INTEGER NOT NULL,
    "MVInvcaruniId" INTEGER NOT NULL,
    "MVOrganizationId" TEXT NOT NULL,
    "MVCiudadId" INTEGER NOT NULL,
    "MVSecuencial" INTEGER NOT NULL,
    "MVFecha" DATE NOT NULL,
    "MVNroDocumento" TEXT NOT NULL,
    "MVCantidad" DECIMAL(7,0) NOT NULL,
    "MVCostoSalida" DECIMAL(9,2),
    "MVCostoUltimo" DECIMAL(9,2) NOT NULL,
    "MVCostoPrecio" DECIMAL(9,2) NOT NULL,
    "MVDescuento" DECIMAL(6,2) NOT NULL,
    "MVImpuesto" DECIMAL(6,2) NOT NULL,
    "MVEsCostoTemporalCero" BOOLEAN NOT NULL DEFAULT false,
    "MVOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "movkar_pkey" PRIMARY KEY ("MVId")
);

-- CreateTable
CREATE TABLE "business"."tmovkar" (
    "TId" SERIAL NOT NULL,
    "TOrganizationId" TEXT NOT NULL,
    "TProposito" "business"."TipoPropositoMovkar",
    "TTipo" INTEGER NOT NULL,
    "TClase" INTEGER NOT NULL,
    "TDescripcion" VARCHAR(30) NOT NULL,
    "TAbreviatura" VARCHAR(10) NOT NULL,
    "TValor" INTEGER NOT NULL,
    "TAjusteInventario" BOOLEAN NOT NULL DEFAULT false,
    "TAfecta" BOOLEAN NOT NULL DEFAULT true,
    "TRequiere" BOOLEAN NOT NULL DEFAULT false,
    "TPedido" BOOLEAN NOT NULL DEFAULT false,
    "TFactura" BOOLEAN NOT NULL DEFAULT false,
    "TProv" BOOLEAN NOT NULL DEFAULT false,
    "TRecalcular" BOOLEAN NOT NULL DEFAULT false,
    "TOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "tmovkar_pkey" PRIMARY KEY ("TId")
);

-- CreateTable
CREATE TABLE "business"."rotado" (
    "RId" SERIAL NOT NULL,
    "ROrganizationId" TEXT NOT NULL,
    "RInvcaruniId" INTEGER NOT NULL,
    "RKardexId" INTEGER NOT NULL,
    "RTipoIO" DECIMAL(1,0) NOT NULL,
    "RClase" DECIMAL(1,0) NOT NULL,
    "RMes" SMALLINT NOT NULL,
    "RAno" SMALLINT NOT NULL,
    "RMesCantidad" DECIMAL(9,2) NOT NULL,
    "RMesPrecio" DECIMAL(9,2) NOT NULL,
    "RMesCosto" DECIMAL(9,2) NOT NULL,
    "RAnoCantidad" DECIMAL(9,2) NOT NULL,
    "RAnoPrecio" DECIMAL(9,2) NOT NULL,
    "RAnoCosto" DECIMAL(9,2) NOT NULL,
    "ROrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "rotado_pkey" PRIMARY KEY ("RId")
);

-- CreateTable
CREATE TABLE "business"."karrev" (
    "RKId" SERIAL NOT NULL,
    "RKKardexId" INTEGER NOT NULL,
    "RKOrganizationId" TEXT NOT NULL,
    "RKCantidad" DECIMAL(9,2) NOT NULL,
    "RKCaracter" BOOLEAN NOT NULL,
    "RKFecha" DATE NOT NULL,
    "RKOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "karrev_pkey" PRIMARY KEY ("RKId")
);

-- CreateTable
CREATE TABLE "business"."MprovedAcum" (
    "MPAId" SERIAL NOT NULL,
    "MPAOrganizationId" TEXT NOT NULL,
    "MPAProveedorId" INTEGER NOT NULL,
    "MPAMes" SMALLINT NOT NULL,
    "MPAAno" SMALLINT NOT NULL,
    "MPAAcumMes" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "MPAAcumAno" DECIMAL(9,2) NOT NULL DEFAULT 0,
    "MPAOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "MprovedAcum_pkey" PRIMARY KEY ("MPAId")
);

-- CreateTable
CREATE TABLE "business"."mproved" (
    "MPId" SERIAL NOT NULL,
    "MPOrganizationId" TEXT NOT NULL,
    "MPCiudadId" INTEGER NOT NULL,
    "MPNro" VARCHAR(13) NOT NULL,
    "MPDescripcion" VARCHAR(40) NOT NULL,
    "MPResponsable" VARCHAR(30) NOT NULL,
    "MPDireccion" VARCHAR(50) NOT NULL,
    "MPTelefono1" TEXT NOT NULL,
    "MPTelefono2" TEXT,
    "MPCorreo1" TEXT NOT NULL,
    "MPCorreo2" TEXT,
    "MPRetencion" VARCHAR(2) NOT NULL,
    "MPFechaCreado" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "MPOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "mproved_pkey" PRIMARY KEY ("MPId")
);

-- CreateTable
CREATE TABLE "business"."proved" (
    "PId" SERIAL NOT NULL,
    "POrganizationId" TEXT NOT NULL,
    "PProveedorId" INTEGER NOT NULL,
    "PInvcaruniId" INTEGER NOT NULL,
    "PCiudadId" INTEGER NOT NULL,
    "PNro" BIGINT NOT NULL,
    "PCostoUltimo" DECIMAL(9,3) NOT NULL,
    "PFecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "POrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "proved_pkey" PRIMARY KEY ("PId")
);

-- CreateTable
CREATE TABLE "business"."paprovee" (
    "PPId" SERIAL NOT NULL,
    "PPOrganizationId" TEXT NOT NULL,
    "PPProveedorId" INTEGER NOT NULL,
    "PPKardexId" INTEGER NOT NULL,
    "PPNro" INTEGER NOT NULL,
    "PPTipo" VARCHAR(1) NOT NULL,
    "PPCantidadPedida" DECIMAL(5,2) NOT NULL,
    "PPCantidadEntregada" DECIMAL(5,2) NOT NULL,
    "PPValorUnitario" DECIMAL(11,2) NOT NULL,
    "PPAprueba" VARCHAR(1) NOT NULL,
    "PPFechaPedido" DATE NOT NULL,
    "PPFechaUltimaCompra" DATE NOT NULL,
    "PPOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "paprovee_pkey" PRIMARY KEY ("PPId")
);

-- CreateTable
CREATE TABLE "business"."pclteu" (
    "PUId" SERIAL NOT NULL,
    "PUOrganizationId" TEXT NOT NULL,
    "PUInvcaruniId" INTEGER NOT NULL,
    "PUPedidoId" INTEGER NOT NULL,
    "PUNroPedido" INTEGER NOT NULL,
    "PUSecuencia" INTEGER NOT NULL,
    "PUGrupo" DECIMAL(3,0) NOT NULL,
    "PUCodigo" DECIMAL(5,0) NOT NULL,
    "PUPedido" DECIMAL(1,0) NOT NULL,
    "PURegistro" DECIMAL(7,0) NOT NULL,
    "PUCantidad" DECIMAL(6,2) NOT NULL,
    "PUFacturado" DECIMAL(6,2) NOT NULL,
    "PUEntregada" DECIMAL(6,2) NOT NULL,
    "PUDescuento" DECIMAL(4,0) NOT NULL,
    "PUImpuesto" DECIMAL(4,0) NOT NULL,
    "PUVrUnitario" DECIMAL(6,2) NOT NULL,
    "PUOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "pclteu_pkey" PRIMARY KEY ("PUId")
);

-- CreateTable
CREATE TABLE "business"."pclteg" (
    "PGCiudadId" INTEGER NOT NULL,
    "PGOrganizationId" TEXT NOT NULL,
    "PGClienteId" INTEGER NOT NULL,
    "PGVendedorId" INTEGER,
    "PGNro" INTEGER NOT NULL,
    "PGNitCliente" BIGINT NOT NULL,
    "PGPago" DECIMAL(1,0) NOT NULL,
    "PGComprador" VARCHAR(30) NOT NULL,
    "PGNitCedula" DECIMAL(10,0) NOT NULL,
    "PGDireccion" VARCHAR(30) NOT NULL,
    "PGTipo" DECIMAL(1,0) NOT NULL,
    "PGZona" DECIMAL(2,0) NOT NULL,
    "PGAprobado" VARCHAR(5) NOT NULL,
    "PGDespachado" VARCHAR(5) NOT NULL,
    "PGTelefono1" DECIMAL(11,0) NOT NULL,
    "PGTelefono2" DECIMAL(11,0) NOT NULL,
    "PGPedido" DECIMAL(6,3) NOT NULL,
    "PGOrdenCompra" DECIMAL(6,3) NOT NULL,
    "PGFechaEntrega" DATE NOT NULL,
    "PGFechaVencimiento" DATE NOT NULL,
    "PGCondicion1" VARCHAR(40) NOT NULL,
    "PGCondicion2" VARCHAR(40) NOT NULL,
    "PGCondicion3" VARCHAR(40) NOT NULL,
    "PGCodigo" DECIMAL(2,0) NOT NULL,
    "PGVrMercancia" DECIMAL(9,2) NOT NULL,
    "PGMCIA" DECIMAL(9,2) NOT NULL,
    "PGNMeses" DECIMAL(2,0) NOT NULL,
    "PGCuota" DECIMAL(11,0) NOT NULL,
    "PGFecha" DATE NOT NULL,
    "PGDescuento" DECIMAL(11,3) NOT NULL,
    "PGOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "pclteg_pkey" PRIMARY KEY ("PGNro","PGOrganizationId")
);

-- CreateTable
CREATE TABLE "business"."vendedores" (
    "VId" SERIAL NOT NULL,
    "VOrganizationId" TEXT NOT NULL,
    "VNombre" TEXT NOT NULL,
    "VCorreo" TEXT NOT NULL,
    "VTelefono" TEXT NOT NULL,
    "VNitCedula" TEXT NOT NULL,
    "VOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "vendedores_pkey" PRIMARY KEY ("VId")
);

-- CreateTable
CREATE TABLE "business"."cltemae" (
    "CId" SERIAL NOT NULL,
    "CCiudadId" INTEGER NOT NULL,
    "COrganizationId" TEXT NOT NULL,
    "CVendedorVId" INTEGER,
    "CNitCedula" TEXT NOT NULL,
    "CRazonSocial" VARCHAR(30) NOT NULL,
    "CNombreCliente" TEXT NOT NULL,
    "CDireccion" VARCHAR(30) NOT NULL,
    "CTelefono1" TEXT NOT NULL,
    "CTelefono2" TEXT,
    "CCorreo1" TEXT NOT NULL,
    "CCorreo2" TEXT,
    "CDiasParaVencerFactura" DECIMAL(2,0) NOT NULL,
    "CRecordatorioPostVencido" DECIMAL(2,0) NOT NULL,
    "CCupoAutorizado" INTEGER NOT NULL DEFAULT 0,
    "CAbonos" INTEGER NOT NULL DEFAULT 0,
    "CFechaIngreso" DATE NOT NULL,
    "COrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "cltemae_pkey" PRIMARY KEY ("CId")
);

-- CreateTable
CREATE TABLE "business"."registro_invitacion" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "modulo" "business"."RegistroInvitacionModulo" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUsuario" VARCHAR(100) NOT NULL,
    "invitedEmail" TEXT,
    "defaultsJson" JSONB NOT NULL,

    CONSTRAINT "registro_invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."business_email_send_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_email_send_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."kardex_facturacion" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invcaruniId" INTEGER NOT NULL,
    "grupo" SMALLINT NOT NULL,
    "codigo" INTEGER NOT NULL,
    "cantidadPedida" DECIMAL(11,0) NOT NULL,
    "cantidadEntregada" DECIMAL(11,0) NOT NULL,
    "orgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "kardex_facturacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."documents" (
    "DOCId" SERIAL NOT NULL,
    "DOCOrganizationId" TEXT NOT NULL,
    "DOCDocumentType" "business"."DocumentType" NOT NULL,
    "DOCDocumentId" INTEGER NOT NULL,
    "DOCFileName" TEXT NOT NULL,
    "DOCOriginalFileName" TEXT NOT NULL,
    "DOCFileKey" TEXT NOT NULL,
    "DOCFileSize" INTEGER NOT NULL,
    "DOCMimeType" TEXT NOT NULL,
    "DOCUploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DOCUploadedBy" VARCHAR(50) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("DOCId")
);

-- CreateTable
CREATE TABLE "business"."outbox_events" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" "business"."OutboxEventType" NOT NULL,
    "aggregateType" "business"."AggregateType" NOT NULL,
    "aggregateId" INTEGER NOT NULL,
    "payload" JSONB,
    "status" "business"."OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "processAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "s3Uploaded" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSkipped" BOOLEAN NOT NULL DEFAULT false,
    "emailResults" JSONB,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."dispatch_order_g" (
    "DOGId" SERIAL NOT NULL,
    "DOGOrganizationId" TEXT NOT NULL,
    "DOGPurchaseOrderId" INTEGER,
    "DOGVendedorId" INTEGER NOT NULL,
    "DOGClienteId" INTEGER NOT NULL,
    "DOGCiudadId" INTEGER NOT NULL,
    "DOGNro" INTEGER NOT NULL,
    "DOGOrgSecuencia" INTEGER NOT NULL,
    "DOGPurchaseOrder" TEXT,
    "DOGTipo" SMALLINT NOT NULL,
    "DOGZona" SMALLINT NOT NULL,
    "DOGValorTotalNeto" DECIMAL(9,2) NOT NULL,
    "DOGValorTotalBruto" DECIMAL(9,2) NOT NULL,
    "DOGTotalDescuento" DECIMAL(9,2) NOT NULL,
    "DOGTotalIVA" DECIMAL(9,2) NOT NULL,
    "DOGPesoTotalKg" DECIMAL(9,3) NOT NULL DEFAULT 0,
    "DOGEstado" "business"."EstadoDispatchOrder" NOT NULL DEFAULT 'DRAFT',
    "DOGAprobado" VARCHAR(5) NOT NULL,
    "DOGDespachado" VARCHAR(5) NOT NULL,
    "DOGEmittedPdfNeedsWarehouseRefresh" BOOLEAN NOT NULL DEFAULT false,
    "DOGFechaCreado" DATE NOT NULL,
    "DOGFechaEmision" TIMESTAMP(3),
    "DOGFechaDespacho" TIMESTAMP(3),
    "DOGFechaFacturacion" TIMESTAMP(3),
    "DOGTelefono1" TEXT NOT NULL,
    "DOGTelefono2" TEXT,
    "DOGCorreo1" TEXT NOT NULL,
    "DOGCorreo2" TEXT,
    "DOGDireccionEntrega" VARCHAR(50) NOT NULL,
    "DOGCondicion1" VARCHAR(40),
    "DOGCondicion2" VARCHAR(40),
    "DOGCondicion3" VARCHAR(40),
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "dispatch_order_g_pkey" PRIMARY KEY ("DOGId")
);

-- CreateTable
CREATE TABLE "business"."dispatch_order_u" (
    "DOUId" SERIAL NOT NULL,
    "DOUOrganizationId" TEXT NOT NULL,
    "DOUDispatchOrderGId" INTEGER NOT NULL,
    "DOUOriginalItemId" INTEGER,
    "DOUInvcaruniId" INTEGER NOT NULL,
    "DOUTipoMovimientoId" INTEGER NOT NULL,
    "DOUModoSalida" "business"."ModoSalida" NOT NULL DEFAULT 'AUTOMATICO',
    "DOUNro" INTEGER NOT NULL,
    "DOUCantidad" DECIMAL(9,2) NOT NULL,
    "DOUDescuento" DECIMAL(9,2) NOT NULL,
    "DOUVrNeto" DECIMAL(9,2) NOT NULL,
    "DOUVrBruto" DECIMAL(9,2) NOT NULL,
    "DOUVrUnitario" DECIMAL(9,2) NOT NULL,
    "DOUDetalle" TEXT NOT NULL,
    "DOUTieneImpuesto" BOOLEAN NOT NULL DEFAULT false,
    "DOUReservado" BOOLEAN NOT NULL DEFAULT false,
    "DOUCostoPromedio" DECIMAL(9,2) NOT NULL,
    "DOUPesoTotalKg" DECIMAL(9,3) NOT NULL DEFAULT 0,
    "DOULote" TEXT NOT NULL,
    "DOUNroDocumento" VARCHAR(50) NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "dispatch_order_u_pkey" PRIMARY KEY ("DOUId")
);

-- CreateTable
CREATE TABLE "business"."reservation_config" (
    "RCId" SERIAL NOT NULL,
    "RCOrganizationId" TEXT NOT NULL,
    "RCDiasExpiracion" INTEGER NOT NULL DEFAULT 3,
    "RCNotificarAntes" INTEGER NOT NULL DEFAULT 1,
    "RCAutoLiberarExpiradas" BOOLEAN NOT NULL DEFAULT true,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "reservation_config_pkey" PRIMARY KEY ("RCId")
);

-- CreateTable
CREATE TABLE "business"."inventory_reservations" (
    "IRId" SERIAL NOT NULL,
    "IROrganizationId" TEXT NOT NULL,
    "IRDispatchOrderUId" INTEGER NOT NULL,
    "IRInvcaruniId" INTEGER NOT NULL,
    "IRKardexLoteId" INTEGER NOT NULL,
    "IRCantidadReservada" INTEGER NOT NULL,
    "IRFechaReserva" DATE NOT NULL,
    "IRFechaExpiracion" DATE NOT NULL,
    "IRFechaLiberacion" DATE,
    "IREstado" "business"."EstadoReserva" NOT NULL DEFAULT 'ACTIVE',
    "IRMotivo" VARCHAR(100),
    "IROrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("IRId")
);

-- CreateTable
CREATE TABLE "business"."facturag" (
    "FGId" SERIAL NOT NULL,
    "FGOrganizationId" TEXT NOT NULL,
    "FGDispatchOrderGId" INTEGER,
    "FGVendedorId" INTEGER NOT NULL,
    "FGClienteId" INTEGER NOT NULL,
    "FGCiudadId" INTEGER NOT NULL,
    "FGNro" INTEGER NOT NULL,
    "FGOrgSecuencia" INTEGER NOT NULL,
    "FGPurchaseOrder" TEXT,
    "FGPago" "business"."TipoPago" NOT NULL,
    "FGValorTotalNeto" DECIMAL(9,2) NOT NULL,
    "FGValorTotalBruto" DECIMAL(9,2) NOT NULL,
    "FGTotalDescuento" DECIMAL(9,2) NOT NULL,
    "FGTotalIVA" DECIMAL(9,2) NOT NULL,
    "FGSaldo" DECIMAL(9,2) NOT NULL,
    "FGEstado" "business"."EstadoFactura" NOT NULL DEFAULT 'ACTIVE',
    "FGFacturaDeSaldo" BOOLEAN NOT NULL DEFAULT false,
    "FGFechaCreado" DATE NOT NULL,
    "FGFechaVencimiento" DATE NOT NULL,
    "FGFechaPago" TIMESTAMP(3),
    "FGTelefono1" TEXT NOT NULL,
    "FGTelefono2" TEXT,
    "FGCorreo1" TEXT NOT NULL,
    "FGCorreo2" TEXT,
    "FGDireccionEntrega" VARCHAR(50) NOT NULL,
    "FGCondicion1" VARCHAR(40),
    "FGCondicion2" VARCHAR(40),
    "FGCondicion3" VARCHAR(40),
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "facturag_pkey" PRIMARY KEY ("FGId")
);

-- CreateTable
CREATE TABLE "business"."mov_cxc" (
    "MCId" SERIAL NOT NULL,
    "MCOrganizationId" TEXT NOT NULL,
    "MCFacturaId" INTEGER NOT NULL,
    "MCTipoMovimientoId" INTEGER NOT NULL,
    "MCNro" INTEGER NOT NULL,
    "MCNroDocumento" TEXT NOT NULL,
    "MCDescripcion" TEXT NOT NULL,
    "MCValor" DECIMAL(9,2) NOT NULL,
    "MCTipoPago" "business"."TipoPago" NOT NULL,
    "MCFecha" DATE NOT NULL,
    "MCSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "mov_cxc_pkey" PRIMARY KEY ("MCId")
);

-- CreateTable
CREATE TABLE "business"."banks" (
    "BId" SERIAL NOT NULL,
    "BOrganizationId" TEXT NOT NULL,
    "BNombre" TEXT NOT NULL,
    "BOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("BId")
);

-- CreateTable
CREATE TABLE "business"."wallet_payments" (
    "WPId" SERIAL NOT NULL,
    "WPMovCXCId" INTEGER NOT NULL,
    "WPOrganizationId" TEXT NOT NULL,
    "WPBancoId" INTEGER NOT NULL,
    "WPNombreWallet" VARCHAR(100) NOT NULL,
    "WPTelefonoOClave" VARCHAR(50) NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "wallet_payments_pkey" PRIMARY KEY ("WPId")
);

-- CreateTable
CREATE TABLE "business"."credit_card_payments" (
    "CCPId" SERIAL NOT NULL,
    "CCPMovCXCId" INTEGER NOT NULL,
    "CCPOrganizationId" TEXT NOT NULL,
    "CCPBancoId" INTEGER NOT NULL,
    "CCPMarca" VARCHAR(50) NOT NULL,
    "CCPUltimos4Digitos" VARCHAR(4) NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "credit_card_payments_pkey" PRIMARY KEY ("CCPId")
);

-- CreateTable
CREATE TABLE "business"."transfer_payments" (
    "TPId" SERIAL NOT NULL,
    "TPMovCXCId" INTEGER NOT NULL,
    "TPOrganizationId" TEXT NOT NULL,
    "TPBancoId" INTEGER NOT NULL,
    "TPTipoCuenta" VARCHAR(50) NOT NULL,
    "TPNumeroCuenta" VARCHAR(50) NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "transfer_payments_pkey" PRIMARY KEY ("TPId")
);

-- CreateTable
CREATE TABLE "business"."check_payments" (
    "CHPId" SERIAL NOT NULL,
    "CHPMovCXCId" INTEGER NOT NULL,
    "CHPOrganizationId" TEXT NOT NULL,
    "CHPBancoId" INTEGER NOT NULL,
    "CHPNumeroCheque" VARCHAR(50) NOT NULL,
    "CHPFechaCheque" DATE NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "check_payments_pkey" PRIMARY KEY ("CHPId")
);

-- CreateTable
CREATE TABLE "business"."facturau" (
    "FUId" SERIAL NOT NULL,
    "FUOrganizationId" TEXT NOT NULL,
    "FUFacturaId" INTEGER NOT NULL,
    "FUOriginalItemId" INTEGER,
    "FUInvcaruniId" INTEGER NOT NULL,
    "FUNro" INTEGER NOT NULL,
    "FUCantidad" DECIMAL(9,2) NOT NULL,
    "FUDescuento" DECIMAL(9,2) NOT NULL,
    "FUVrNeto" DECIMAL(9,2) NOT NULL,
    "FUVrBruto" DECIMAL(9,2) NOT NULL,
    "FUVrUnitario" DECIMAL(9,2) NOT NULL,
    "FUDetalle" TEXT NOT NULL,
    "FUTieneImpuesto" BOOLEAN NOT NULL DEFAULT false,
    "FULote" TEXT NOT NULL,
    "FULoteNroDocumento" VARCHAR(50) NOT NULL,
    "FUMovCXCId" INTEGER,
    "FUCostoPromedio" DECIMAL(9,2) NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "facturau_pkey" PRIMARY KEY ("FUId")
);

-- CreateTable
CREATE TABLE "business"."rclteg" (
    "RGId" SERIAL NOT NULL,
    "RGOrganizationId" TEXT NOT NULL,
    "RGClienteId" INTEGER NOT NULL,
    "RGVendedorId" INTEGER,
    "RGNro" DECIMAL(6,0) NOT NULL,
    "RGNitCliente" BIGINT NOT NULL,
    "RGPago" SMALLINT NOT NULL,
    "RGComprador" VARCHAR(30) NOT NULL,
    "RGNitCedula" DECIMAL(10,3) NOT NULL,
    "RGDireccion" VARCHAR(30) NOT NULL,
    "RGTipo" SMALLINT NOT NULL,
    "RGZona" SMALLINT NOT NULL,
    "RGAprobado" VARCHAR(5) NOT NULL,
    "RGDespachado" VARCHAR(5) NOT NULL,
    "RGTelefono1" DECIMAL(7,3) NOT NULL,
    "RGTelefono2" DECIMAL(7,3) NOT NULL,
    "RGCiudad" VARCHAR(12) NOT NULL,
    "RGPedido" DECIMAL(6,3) NOT NULL,
    "RGOrdenCompra" DECIMAL(6,3) NOT NULL,
    "RGFechaEntrega" DATE NOT NULL,
    "RGFechaVencimiento" DATE NOT NULL,
    "RGCondicion1" VARCHAR(40) NOT NULL,
    "RGCondicion2" VARCHAR(40) NOT NULL,
    "RGCondicion3" VARCHAR(40) NOT NULL,
    "RGOrgSecuencia" INTEGER NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "rclteg_pkey" PRIMARY KEY ("RGId")
);

-- CreateTable
CREATE TABLE "business"."rclteu" (
    "RUId" SERIAL NOT NULL,
    "RUOrganizationId" TEXT NOT NULL,
    "RURemisionId" INTEGER NOT NULL,
    "RUNroRemision" DECIMAL(6,0) NOT NULL,
    "RUSecuencia" SMALLINT NOT NULL,
    "RUGrupo" SMALLINT NOT NULL,
    "RUCodigo" INTEGER NOT NULL,
    "RUCantidad" DECIMAL(8,3) NOT NULL,
    "RUVrUnitario" DECIMAL(8,3) NOT NULL,
    "creadoOModificado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "rclteu_pkey" PRIMARY KEY ("RUId")
);

-- CreateTable
CREATE TABLE "business"."accounts_receivable" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "customer" VARCHAR(50) NOT NULL,
    "country" VARCHAR(50) NOT NULL,
    "seller" VARCHAR(50) NOT NULL,
    "upcoming_amount_receivable_usd" DECIMAL(12,2),
    "due_date" DATE NOT NULL,
    "method_of_payment" VARCHAR(10) NOT NULL,
    "upcoming_due_days" INTEGER,
    "days_expired_1_a_30" DECIMAL(12,2),
    "days_expired_31_a_60" DECIMAL(12,2),
    "days_expired_61_a_90" DECIMAL(12,2),
    "days_expired_mas_de_90" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."dso" (
    "id" SERIAL NOT NULL,
    "fecha_periodo" DATE NOT NULL,
    "cuentas_por_cobrar" DECIMAL(12,2) NOT NULL,
    "ventas_a_credito" DECIMAL(12,2) NOT NULL,
    "periodo" INTEGER NOT NULL,
    "dso" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."inventory_fis_caruni" (
    "id" SERIAL NOT NULL,
    "cgrupo" INTEGER NOT NULL,
    "ccodigo" INTEGER NOT NULL,
    "cdescripcion" VARCHAR(50) NOT NULL,
    "cunidad" VARCHAR(20) NOT NULL,
    "cprecio_pub" DECIMAL(8,2) NOT NULL,
    "cmargen" DECIMAL(4,2) NOT NULL,
    "ctope_desc" DECIMAL(4,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_fis_caruni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."inventory_fis_kardex" (
    "id" SERIAL NOT NULL,
    "ckgrupo" INTEGER NOT NULL,
    "ckcodigo" INTEGER NOT NULL,
    "cdescripcion" VARCHAR(50) NOT NULL,
    "kexistencia_fis_i" DECIMAL(9,2) NOT NULL,
    "kentradas" DECIMAL(9,2) NOT NULL,
    "kvalor_entradas" DECIMAL(12,2) NOT NULL,
    "ksalidas" DECIMAL(9,2) NOT NULL,
    "kvalor_salidas" DECIMAL(12,2) NOT NULL,
    "kexistencia_fis_f" DECIMAL(9,2) NOT NULL,
    "kcosto_ult" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_fis_kardex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."inventory_fis_kardex_lote" (
    "id" SERIAL NOT NULL,
    "cklgrupo" INTEGER NOT NULL,
    "cklcodigo" INTEGER NOT NULL,
    "ckldescripcion" VARCHAR(50) NOT NULL,
    "cklpaisorigen" INTEGER NOT NULL,
    "cklpaisorigenn" VARCHAR(30) NOT NULL,
    "ckllote" INTEGER NOT NULL,
    "cklexistencia_fis_i" DECIMAL(9,2) NOT NULL,
    "cklentradas" DECIMAL(9,2) NOT NULL,
    "cklvalor_entradas" DECIMAL(12,2) NOT NULL,
    "cklsalidas" DECIMAL(9,2) NOT NULL,
    "cklvalor_salidas" DECIMAL(12,2) NOT NULL,
    "cklexistencia_fis_f" DECIMAL(9,2) NOT NULL,
    "cklcosto_ult" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_fis_kardex_lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."inventory_fis_movkar" (
    "id" SERIAL NOT NULL,
    "mvseq" INTEGER NOT NULL,
    "mvgrupo" INTEGER NOT NULL,
    "mvcodigo" INTEGER NOT NULL,
    "cdescripcion" VARCHAR(50) NOT NULL,
    "mvfecha" DATE NOT NULL,
    "mvpedido_fac" INTEGER NOT NULL,
    "mvtipo" INTEGER NOT NULL,
    "mvclase" INTEGER NOT NULL,
    "mvdesctm" VARCHAR(30) NOT NULL,
    "mvnro_doc" INTEGER NOT NULL,
    "mvpaisorigen" INTEGER NOT NULL,
    "mvpaisorigenn" VARCHAR(30) NOT NULL,
    "mvprov_cliente" INTEGER NOT NULL,
    "mvdescprov" VARCHAR(50) NOT NULL,
    "mvcantidad" DECIMAL(9,2) NOT NULL,
    "mvcosto" DECIMAL(8,2) NOT NULL,
    "mvprecio" DECIMAL(8,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_fis_movkar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."inventory_rotacion" (
    "id" SERIAL NOT NULL,
    "purchase_date" DATE NOT NULL,
    "product" VARCHAR(50) NOT NULL,
    "country_of_origin" VARCHAR(30) NOT NULL,
    "stock_ini" DECIMAL(9,2) NOT NULL,
    "ending_stocks" DECIMAL(9,2) NOT NULL,
    "days_of_period" INTEGER NOT NULL,
    "cost_mont" DECIMAL(12,2) NOT NULL,
    "inv_prom" DECIMAL(9,2) NOT NULL,
    "rotacion" DECIMAL(8,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year_mont" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_rotacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."liquidaciones_encabezado" (
    "id" SERIAL NOT NULL,
    "nro_lote" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "stock" DECIMAL(9,2) NOT NULL,
    "supplier" VARCHAR(50) NOT NULL,
    "origen" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_encabezado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."liquidaciones_gastos" (
    "id" SERIAL NOT NULL,
    "nro_lote" VARCHAR(20) NOT NULL,
    "transaction_gto" VARCHAR(30) NOT NULL,
    "cod_concep_gto" INTEGER NOT NULL,
    "description_gto" VARCHAR(50) NOT NULL,
    "nro_dcto_gto" INTEGER NOT NULL,
    "amount_gtos" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."liquidaciones_costos" (
    "id" SERIAL NOT NULL,
    "nro_lote" VARCHAR(20) NOT NULL,
    "transaction_cto" VARCHAR(30) NOT NULL,
    "cod_concep_cto" INTEGER NOT NULL,
    "description_cto" VARCHAR(50) NOT NULL,
    "nro_dcto_cto" INTEGER NOT NULL,
    "amount_ctos" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_costos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."liquidaciones_ventas" (
    "id" SERIAL NOT NULL,
    "nro_lote" VARCHAR(20) NOT NULL,
    "transaction_vta" VARCHAR(30) NOT NULL,
    "cod_concep_vta" INTEGER NOT NULL,
    "description_vta" VARCHAR(50) NOT NULL,
    "nro_dcto_vta" INTEGER NOT NULL,
    "amount_vtas" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."liquidaciones_resumen" (
    "id" SERIAL NOT NULL,
    "nro_lote" VARCHAR(20) NOT NULL,
    "t_amount_gtos" DECIMAL(12,2) NOT NULL,
    "t_amount_ctos" DECIMAL(12,2) NOT NULL,
    "t_sum_gtos_ctos" DECIMAL(12,2) NOT NULL,
    "t_amount_vtas" DECIMAL(12,2) NOT NULL,
    "t_amount_rta" DECIMAL(12,2) NOT NULL,
    "t_amount_rta_pct" DECIMAL(8,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_resumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."sales_ac" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "customer" VARCHAR(50) NOT NULL,
    "invoice_number" INTEGER NOT NULL,
    "product" VARCHAR(100) NOT NULL,
    "region" VARCHAR(30) NOT NULL,
    "seller" VARCHAR(30) NOT NULL,
    "units_sold" INTEGER NOT NULL,
    "unit_price_usd" DECIMAL(10,2) NOT NULL,
    "total_sales_usd" DECIMAL(12,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year_month" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_ac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."periodos_cierre" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mes" SMALLINT NOT NULL,
    "ano" SMALLINT NOT NULL,
    "cerradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoPor" VARCHAR(50) NOT NULL,

    CONSTRAINT "periodos_cierre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."periodos_activos" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mes" SMALLINT NOT NULL,
    "ano" SMALLINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_activos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "auth"."user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "auth"."session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "auth"."session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "auth"."account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "auth"."verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "auth"."organization"("slug");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "auth"."member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "auth"."member"("userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "auth"."invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "auth"."invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "estados_nombre_paisId_key" ON "business"."estados"("nombre", "paisId");

-- CreateIndex
CREATE UNIQUE INDEX "ciudades_nombre_estadoId_key" ON "business"."ciudades"("nombre", "estadoId");

-- CreateIndex
CREATE UNIQUE INDEX "acumulados_pais_paisId_mes_ano_key" ON "business"."acumulados_pais"("paisId", "mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "acumulados_estado_estadoId_mes_ano_key" ON "business"."acumulados_estado"("estadoId", "mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "acumulados_ciudad_ciudadId_mes_ano_key" ON "business"."acumulados_ciudad"("ciudadId", "mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_UMOrganizationId_UMOrgSecuencia_key" ON "business"."unidades_medida"("UMOrganizationId", "UMOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "clases_almacen_CAOrganizationId_CACodigo_key" ON "business"."clases_almacen"("CAOrganizationId", "CACodigo");

-- CreateIndex
CREATE UNIQUE INDEX "almacenes_ALOrganizationId_ALOrgSecuencia_key" ON "business"."almacenes"("ALOrganizationId", "ALOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_sucursal_PSOrganizationId_PSOrgSecuencia_key" ON "business"."pedidos_sucursal"("PSOrganizationId", "PSOrgSecuencia");

-- CreateIndex
CREATE INDEX "invcaruni_CKOrganizationId_CKDescripcion_idx" ON "business"."invcaruni"("CKOrganizationId", "CKDescripcion");

-- CreateIndex
CREATE INDEX "invcaruni_CKOrganizationId_CKOrigenId_idx" ON "business"."invcaruni"("CKOrganizationId", "CKOrigenId");

-- CreateIndex
CREATE UNIQUE INDEX "invcaruni_CKOrganizationId_CKGrupoId_CKCodigo_key" ON "business"."invcaruni"("CKOrganizationId", "CKGrupoId", "CKCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "invcaruni_CKOrganizationId_CKOrgSecuencia_key" ON "business"."invcaruni"("CKOrganizationId", "CKOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_GNro_GOrganizationId_key" ON "business"."grupos"("GNro", "GOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_GOrganizationId_GOrgSecuencia_key" ON "business"."grupos"("GOrganizationId", "GOrgSecuencia");

-- CreateIndex
CREATE INDEX "kardex_KOrganizationId_KExistenciaFin_idx" ON "business"."kardex"("KOrganizationId", "KExistenciaFin");

-- CreateIndex
CREATE UNIQUE INDEX "kardex_KOrganizationId_KInvcaruniId_KAlmacenId_KMes_KAno_key" ON "business"."kardex"("KOrganizationId", "KInvcaruniId", "KAlmacenId", "KMes", "KAno");

-- CreateIndex
CREATE UNIQUE INDEX "kardex_KOrganizationId_KOrgSecuencia_key" ON "business"."kardex"("KOrganizationId", "KOrgSecuencia");

-- CreateIndex
CREATE INDEX "kardex_lote_KLExistenciaFin_idx" ON "business"."kardex_lote"("KLExistenciaFin");

-- CreateIndex
CREATE UNIQUE INDEX "kardex_lote_KLKardexId_KLCiudadId_KLLote_KLNroDocumento_KLM_key" ON "business"."kardex_lote"("KLKardexId", "KLCiudadId", "KLLote", "KLNroDocumento", "KLMes", "KLAno");

-- CreateIndex
CREATE INDEX "idx_kardex_det_fecha" ON "business"."kardex_det"("KDFecha");

-- CreateIndex
CREATE UNIQUE INDEX "kardex_det_KDKardexLoteId_KDFecha_KDMes_KDAno_key" ON "business"."kardex_det"("KDKardexLoteId", "KDFecha", "KDMes", "KDAno");

-- CreateIndex
CREATE INDEX "idx_movkar_tipo_fecha" ON "business"."movkar"("MVTipoMovimientoId", "MVFecha");

-- CreateIndex
CREATE INDEX "idx_movkar_tipo_doc" ON "business"."movkar"("MVTipoMovimientoId", "MVNroDocumento");

-- CreateIndex
CREATE INDEX "idx_movkar_org_fecha" ON "business"."movkar"("MVOrganizationId", "MVFecha");

-- CreateIndex
CREATE INDEX "idx_movkar_org_inventario" ON "business"."movkar"("MVOrganizationId", "MVInvcaruniId", "MVAlmacenId");

-- CreateIndex
CREATE UNIQUE INDEX "movkar_MVOrganizationId_MVOrgSecuencia_key" ON "business"."movkar"("MVOrganizationId", "MVOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "movkar_MVOrganizationId_MVSecuencial_key" ON "business"."movkar"("MVOrganizationId", "MVSecuencial");

-- CreateIndex
CREATE UNIQUE INDEX "tmovkar_TOrganizationId_TOrgSecuencia_key" ON "business"."tmovkar"("TOrganizationId", "TOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "tmovkar_TOrganizationId_TProposito_key" ON "business"."tmovkar"("TOrganizationId", "TProposito");

-- CreateIndex
CREATE UNIQUE INDEX "tmovkar_TOrganizationId_TTipo_TClase_key" ON "business"."tmovkar"("TOrganizationId", "TTipo", "TClase");

-- CreateIndex
CREATE UNIQUE INDEX "rotado_ROrganizationId_ROrgSecuencia_key" ON "business"."rotado"("ROrganizationId", "ROrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "karrev_RKOrganizationId_RKOrgSecuencia_key" ON "business"."karrev"("RKOrganizationId", "RKOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "MprovedAcum_MPAOrganizationId_MPAOrgSecuencia_key" ON "business"."MprovedAcum"("MPAOrganizationId", "MPAOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "mproved_MPNro_MPOrganizationId_key" ON "business"."mproved"("MPNro", "MPOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "mproved_MPOrganizationId_MPOrgSecuencia_key" ON "business"."mproved"("MPOrganizationId", "MPOrgSecuencia");

-- CreateIndex
CREATE INDEX "proved_PInvcaruniId_PFecha_idx" ON "business"."proved"("PInvcaruniId", "PFecha");

-- CreateIndex
CREATE UNIQUE INDEX "proved_POrganizationId_POrgSecuencia_key" ON "business"."proved"("POrganizationId", "POrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "paprovee_PPNro_PPOrganizationId_key" ON "business"."paprovee"("PPNro", "PPOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "paprovee_PPOrganizationId_PPOrgSecuencia_key" ON "business"."paprovee"("PPOrganizationId", "PPOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "pclteu_PUOrganizationId_PUOrgSecuencia_key" ON "business"."pclteu"("PUOrganizationId", "PUOrgSecuencia");

-- CreateIndex
CREATE INDEX "pclteg_PGNitCliente_idx" ON "business"."pclteg"("PGNitCliente");

-- CreateIndex
CREATE INDEX "pclteg_PGPago_idx" ON "business"."pclteg"("PGPago");

-- CreateIndex
CREATE INDEX "pclteg_PGFechaEntrega_idx" ON "business"."pclteg"("PGFechaEntrega");

-- CreateIndex
CREATE UNIQUE INDEX "pclteg_PGOrganizationId_PGOrgSecuencia_key" ON "business"."pclteg"("PGOrganizationId", "PGOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "vendedores_VOrganizationId_VOrgSecuencia_key" ON "business"."vendedores"("VOrganizationId", "VOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "vendedores_VNitCedula_VOrganizationId_key" ON "business"."vendedores"("VNitCedula", "VOrganizationId");

-- CreateIndex
CREATE INDEX "cltemae_CRazonSocial_idx" ON "business"."cltemae"("CRazonSocial");

-- CreateIndex
CREATE UNIQUE INDEX "cltemae_CNitCedula_COrganizationId_key" ON "business"."cltemae"("CNitCedula", "COrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "cltemae_COrganizationId_COrgSecuencia_key" ON "business"."cltemae"("COrganizationId", "COrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "registro_invitacion_tokenHash_key" ON "business"."registro_invitacion"("tokenHash");

-- CreateIndex
CREATE INDEX "registro_invitacion_organizationId_modulo_usedAt_idx" ON "business"."registro_invitacion"("organizationId", "modulo", "usedAt");

-- CreateIndex
CREATE INDEX "business_email_send_logs_organizationId_idx" ON "business"."business_email_send_logs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "business_email_send_logs_organizationId_scopeKey_key" ON "business"."business_email_send_logs"("organizationId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "kardex_facturacion_grupo_codigo_key" ON "business"."kardex_facturacion"("grupo", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "kardex_facturacion_organizationId_orgSecuencia_key" ON "business"."kardex_facturacion"("organizationId", "orgSecuencia");

-- CreateIndex
CREATE INDEX "documents_DOCOrganizationId_DOCDocumentType_DOCDocumentId_idx" ON "business"."documents"("DOCOrganizationId", "DOCDocumentType", "DOCDocumentId");

-- CreateIndex
CREATE INDEX "documents_DOCOrganizationId_DOCDocumentType_idx" ON "business"."documents"("DOCOrganizationId", "DOCDocumentType");

-- CreateIndex
CREATE INDEX "outbox_events_status_processAfter_idx" ON "business"."outbox_events"("status", "processAfter");

-- CreateIndex
CREATE INDEX "outbox_events_organizationId_eventType_idx" ON "business"."outbox_events"("organizationId", "eventType");

-- CreateIndex
CREATE INDEX "dispatch_order_g_DOGEstado_idx" ON "business"."dispatch_order_g"("DOGEstado");

-- CreateIndex
CREATE INDEX "dispatch_order_g_DOGOrganizationId_DOGEstado_idx" ON "business"."dispatch_order_g"("DOGOrganizationId", "DOGEstado");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_order_g_DOGOrganizationId_DOGOrgSecuencia_key" ON "business"."dispatch_order_g"("DOGOrganizationId", "DOGOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_order_g_DOGOrganizationId_DOGNro_key" ON "business"."dispatch_order_g"("DOGOrganizationId", "DOGNro");

-- CreateIndex
CREATE INDEX "dispatch_order_u_DOUOrganizationId_DOUOriginalItemId_idx" ON "business"."dispatch_order_u"("DOUOrganizationId", "DOUOriginalItemId");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_config_RCOrganizationId_key" ON "business"."reservation_config"("RCOrganizationId");

-- CreateIndex
CREATE INDEX "inventory_reservations_IREstado_IRFechaExpiracion_idx" ON "business"."inventory_reservations"("IREstado", "IRFechaExpiracion");

-- CreateIndex
CREATE INDEX "inventory_reservations_IROrganizationId_IRInvcaruniId_IREst_idx" ON "business"."inventory_reservations"("IROrganizationId", "IRInvcaruniId", "IREstado");

-- CreateIndex
CREATE INDEX "inventory_reservations_IRKardexLoteId_IREstado_idx" ON "business"."inventory_reservations"("IRKardexLoteId", "IREstado");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_reservations_IROrganizationId_IROrgSecuencia_key" ON "business"."inventory_reservations"("IROrganizationId", "IROrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "facturag_FGDispatchOrderGId_key" ON "business"."facturag"("FGDispatchOrderGId");

-- CreateIndex
CREATE INDEX "facturag_FGPago_idx" ON "business"."facturag"("FGPago");

-- CreateIndex
CREATE INDEX "facturag_FGEstado_idx" ON "business"."facturag"("FGEstado");

-- CreateIndex
CREATE INDEX "facturag_FGOrganizationId_FGEstado_idx" ON "business"."facturag"("FGOrganizationId", "FGEstado");

-- CreateIndex
CREATE UNIQUE INDEX "facturag_FGOrganizationId_FGOrgSecuencia_key" ON "business"."facturag"("FGOrganizationId", "FGOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "facturag_FGOrganizationId_FGNro_FGFacturaDeSaldo_key" ON "business"."facturag"("FGOrganizationId", "FGNro", "FGFacturaDeSaldo");

-- CreateIndex
CREATE UNIQUE INDEX "mov_cxc_MCOrganizationId_MCFacturaId_MCSecuencia_key" ON "business"."mov_cxc"("MCOrganizationId", "MCFacturaId", "MCSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "banks_BOrganizationId_BNombre_key" ON "business"."banks"("BOrganizationId", "BNombre");

-- CreateIndex
CREATE UNIQUE INDEX "banks_BOrganizationId_BOrgSecuencia_key" ON "business"."banks"("BOrganizationId", "BOrgSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_payments_WPMovCXCId_key" ON "business"."wallet_payments"("WPMovCXCId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_payments_CCPMovCXCId_key" ON "business"."credit_card_payments"("CCPMovCXCId");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_payments_TPMovCXCId_key" ON "business"."transfer_payments"("TPMovCXCId");

-- CreateIndex
CREATE UNIQUE INDEX "check_payments_CHPMovCXCId_key" ON "business"."check_payments"("CHPMovCXCId");

-- CreateIndex
CREATE INDEX "facturau_FUOrganizationId_FUOriginalItemId_idx" ON "business"."facturau"("FUOrganizationId", "FUOriginalItemId");

-- CreateIndex
CREATE INDEX "rclteg_RGNitCliente_idx" ON "business"."rclteg"("RGNitCliente");

-- CreateIndex
CREATE INDEX "rclteg_RGPago_idx" ON "business"."rclteg"("RGPago");

-- CreateIndex
CREATE INDEX "rclteg_RGFechaEntrega_idx" ON "business"."rclteg"("RGFechaEntrega");

-- CreateIndex
CREATE UNIQUE INDEX "rclteg_RGOrganizationId_RGOrgSecuencia_key" ON "business"."rclteg"("RGOrganizationId", "RGOrgSecuencia");

-- CreateIndex
CREATE INDEX "rclteu_RUGrupo_RUCodigo_RUNroRemision_idx" ON "business"."rclteu"("RUGrupo", "RUCodigo", "RUNroRemision");

-- CreateIndex
CREATE UNIQUE INDEX "rclteu_RUNroRemision_RUSecuencia_key" ON "business"."rclteu"("RUNroRemision", "RUSecuencia");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_cierre_organizationId_mes_ano_key" ON "business"."periodos_cierre"("organizationId", "mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_activos_userId_organizationId_key" ON "business"."periodos_activos"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."paises" ADD CONSTRAINT "paises_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."estados" ADD CONSTRAINT "estados_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "business"."paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."estados" ADD CONSTRAINT "estados_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."ciudades" ADD CONSTRAINT "ciudades_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "business"."estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."ciudades" ADD CONSTRAINT "ciudades_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."organization_ciudad" ADD CONSTRAINT "organization_ciudad_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."organization_ciudad" ADD CONSTRAINT "organization_ciudad_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."acumulados_pais" ADD CONSTRAINT "acumulados_pais_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "business"."paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."acumulados_pais" ADD CONSTRAINT "acumulados_pais_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."acumulados_estado" ADD CONSTRAINT "acumulados_estado_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "business"."estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."acumulados_estado" ADD CONSTRAINT "acumulados_estado_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."acumulados_ciudad" ADD CONSTRAINT "acumulados_ciudad_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."acumulados_ciudad" ADD CONSTRAINT "acumulados_ciudad_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."unidades_medida" ADD CONSTRAINT "unidades_medida_UMOrganizationId_fkey" FOREIGN KEY ("UMOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."clases_almacen" ADD CONSTRAINT "clases_almacen_CAOrganizationId_fkey" FOREIGN KEY ("CAOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."almacenes" ADD CONSTRAINT "almacenes_ALOrganizationId_fkey" FOREIGN KEY ("ALOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."almacenes" ADD CONSTRAINT "almacenes_ALCiudadId_fkey" FOREIGN KEY ("ALCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pedidos_sucursal" ADD CONSTRAINT "pedidos_sucursal_PSAlmacenId_fkey" FOREIGN KEY ("PSAlmacenId") REFERENCES "business"."almacenes"("ALId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pedidos_sucursal" ADD CONSTRAINT "pedidos_sucursal_PSInvcaruniId_fkey" FOREIGN KEY ("PSInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pedidos_sucursal" ADD CONSTRAINT "pedidos_sucursal_PSOrganizationId_fkey" FOREIGN KEY ("PSOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."invcaruni" ADD CONSTRAINT "invcaruni_CKOrganizationId_fkey" FOREIGN KEY ("CKOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."invcaruni" ADD CONSTRAINT "invcaruni_CKGrupoId_fkey" FOREIGN KEY ("CKGrupoId") REFERENCES "business"."grupos"("GId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."invcaruni" ADD CONSTRAINT "invcaruni_CKUnidadMedidaId_fkey" FOREIGN KEY ("CKUnidadMedidaId") REFERENCES "business"."unidades_medida"("UMId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."invcaruni" ADD CONSTRAINT "invcaruni_CKOrigenId_fkey" FOREIGN KEY ("CKOrigenId") REFERENCES "business"."paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."grupos" ADD CONSTRAINT "grupos_GOrganizationId_fkey" FOREIGN KEY ("GOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex" ADD CONSTRAINT "kardex_KInvcaruniId_fkey" FOREIGN KEY ("KInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex" ADD CONSTRAINT "kardex_KOrganizationId_fkey" FOREIGN KEY ("KOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex" ADD CONSTRAINT "kardex_KAlmacenId_fkey" FOREIGN KEY ("KAlmacenId") REFERENCES "business"."almacenes"("ALId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_lote" ADD CONSTRAINT "kardex_lote_KLKardexId_fkey" FOREIGN KEY ("KLKardexId") REFERENCES "business"."kardex"("KId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_lote" ADD CONSTRAINT "kardex_lote_KLCiudadId_fkey" FOREIGN KEY ("KLCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_lote" ADD CONSTRAINT "kardex_lote_KLOrganizationId_fkey" FOREIGN KEY ("KLOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_lote" ADD CONSTRAINT "kardex_lote_KLInvcaruniId_fkey" FOREIGN KEY ("KLInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_lote" ADD CONSTRAINT "kardex_lote_KAlmacenId_fkey" FOREIGN KEY ("KAlmacenId") REFERENCES "business"."almacenes"("ALId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_det" ADD CONSTRAINT "kardex_det_KDKardexLoteId_fkey" FOREIGN KEY ("KDKardexLoteId") REFERENCES "business"."kardex_lote"("KLId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_det" ADD CONSTRAINT "kardex_det_KDOrganizationId_fkey" FOREIGN KEY ("KDOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_det" ADD CONSTRAINT "kardex_det_KDInvcaruniId_fkey" FOREIGN KEY ("KDInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_det" ADD CONSTRAINT "kardex_det_KDAlmacenId_fkey" FOREIGN KEY ("KDAlmacenId") REFERENCES "business"."almacenes"("ALId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_det" ADD CONSTRAINT "kardex_det_KDCiudadId_fkey" FOREIGN KEY ("KDCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVKardexDetId_fkey" FOREIGN KEY ("MVKardexDetId") REFERENCES "business"."kardex_det"("KDId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVTipoMovimientoId_fkey" FOREIGN KEY ("MVTipoMovimientoId") REFERENCES "business"."tmovkar"("TId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVProveedorId_fkey" FOREIGN KEY ("MVProveedorId") REFERENCES "business"."mproved"("MPId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVClienteId_fkey" FOREIGN KEY ("MVClienteId") REFERENCES "business"."cltemae"("CId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVOrganizationId_fkey" FOREIGN KEY ("MVOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVInvcaruniId_fkey" FOREIGN KEY ("MVInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVAlmacenId_fkey" FOREIGN KEY ("MVAlmacenId") REFERENCES "business"."almacenes"("ALId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."movkar" ADD CONSTRAINT "movkar_MVCiudadId_fkey" FOREIGN KEY ("MVCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."tmovkar" ADD CONSTRAINT "tmovkar_TOrganizationId_fkey" FOREIGN KEY ("TOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."rotado" ADD CONSTRAINT "rotado_ROrganizationId_fkey" FOREIGN KEY ("ROrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."rotado" ADD CONSTRAINT "rotado_RKardexId_fkey" FOREIGN KEY ("RKardexId") REFERENCES "business"."kardex"("KId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."karrev" ADD CONSTRAINT "karrev_RKKardexId_fkey" FOREIGN KEY ("RKKardexId") REFERENCES "business"."kardex"("KId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."karrev" ADD CONSTRAINT "karrev_RKOrganizationId_fkey" FOREIGN KEY ("RKOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."MprovedAcum" ADD CONSTRAINT "MprovedAcum_MPAOrganizationId_fkey" FOREIGN KEY ("MPAOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."MprovedAcum" ADD CONSTRAINT "MprovedAcum_MPAProveedorId_fkey" FOREIGN KEY ("MPAProveedorId") REFERENCES "business"."mproved"("MPId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."mproved" ADD CONSTRAINT "mproved_MPCiudadId_fkey" FOREIGN KEY ("MPCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."mproved" ADD CONSTRAINT "mproved_MPOrganizationId_fkey" FOREIGN KEY ("MPOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."proved" ADD CONSTRAINT "proved_POrganizationId_fkey" FOREIGN KEY ("POrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."proved" ADD CONSTRAINT "proved_PCiudadId_fkey" FOREIGN KEY ("PCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."proved" ADD CONSTRAINT "proved_PInvcaruniId_fkey" FOREIGN KEY ("PInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."proved" ADD CONSTRAINT "proved_PProveedorId_fkey" FOREIGN KEY ("PProveedorId") REFERENCES "business"."mproved"("MPId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."paprovee" ADD CONSTRAINT "paprovee_PPOrganizationId_fkey" FOREIGN KEY ("PPOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."paprovee" ADD CONSTRAINT "paprovee_PPKardexId_fkey" FOREIGN KEY ("PPKardexId") REFERENCES "business"."kardex"("KId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."paprovee" ADD CONSTRAINT "paprovee_PPProveedorId_fkey" FOREIGN KEY ("PPProveedorId") REFERENCES "business"."mproved"("MPId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pclteu" ADD CONSTRAINT "pclteu_PUOrganizationId_fkey" FOREIGN KEY ("PUOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pclteu" ADD CONSTRAINT "pclteu_PUNroPedido_PUOrganizationId_fkey" FOREIGN KEY ("PUNroPedido", "PUOrganizationId") REFERENCES "business"."pclteg"("PGNro", "PGOrganizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pclteu" ADD CONSTRAINT "pclteu_PUInvcaruniId_fkey" FOREIGN KEY ("PUInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pclteg" ADD CONSTRAINT "pclteg_PGCiudadId_fkey" FOREIGN KEY ("PGCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pclteg" ADD CONSTRAINT "pclteg_PGClienteId_fkey" FOREIGN KEY ("PGClienteId") REFERENCES "business"."cltemae"("CId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pclteg" ADD CONSTRAINT "pclteg_PGOrganizationId_fkey" FOREIGN KEY ("PGOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."pclteg" ADD CONSTRAINT "pclteg_PGVendedorId_fkey" FOREIGN KEY ("PGVendedorId") REFERENCES "business"."vendedores"("VId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."vendedores" ADD CONSTRAINT "vendedores_VOrganizationId_fkey" FOREIGN KEY ("VOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."cltemae" ADD CONSTRAINT "cltemae_CCiudadId_fkey" FOREIGN KEY ("CCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."cltemae" ADD CONSTRAINT "cltemae_COrganizationId_fkey" FOREIGN KEY ("COrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."cltemae" ADD CONSTRAINT "cltemae_CVendedorVId_fkey" FOREIGN KEY ("CVendedorVId") REFERENCES "business"."vendedores"("VId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."registro_invitacion" ADD CONSTRAINT "registro_invitacion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."business_email_send_logs" ADD CONSTRAINT "business_email_send_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."kardex_facturacion" ADD CONSTRAINT "kardex_facturacion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."documents" ADD CONSTRAINT "documents_DOCOrganizationId_fkey" FOREIGN KEY ("DOCOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."outbox_events" ADD CONSTRAINT "outbox_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_g" ADD CONSTRAINT "dispatch_order_g_DOGOrganizationId_fkey" FOREIGN KEY ("DOGOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_g" ADD CONSTRAINT "dispatch_order_g_DOGClienteId_fkey" FOREIGN KEY ("DOGClienteId") REFERENCES "business"."cltemae"("CId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_g" ADD CONSTRAINT "dispatch_order_g_DOGVendedorId_fkey" FOREIGN KEY ("DOGVendedorId") REFERENCES "business"."vendedores"("VId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_g" ADD CONSTRAINT "dispatch_order_g_DOGCiudadId_fkey" FOREIGN KEY ("DOGCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_u" ADD CONSTRAINT "dispatch_order_u_DOUOrganizationId_fkey" FOREIGN KEY ("DOUOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_u" ADD CONSTRAINT "dispatch_order_u_DOUDispatchOrderGId_fkey" FOREIGN KEY ("DOUDispatchOrderGId") REFERENCES "business"."dispatch_order_g"("DOGId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_u" ADD CONSTRAINT "dispatch_order_u_DOUOriginalItemId_fkey" FOREIGN KEY ("DOUOriginalItemId") REFERENCES "business"."dispatch_order_u"("DOUId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_u" ADD CONSTRAINT "dispatch_order_u_DOUInvcaruniId_fkey" FOREIGN KEY ("DOUInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."dispatch_order_u" ADD CONSTRAINT "dispatch_order_u_DOUTipoMovimientoId_fkey" FOREIGN KEY ("DOUTipoMovimientoId") REFERENCES "business"."tmovkar"("TId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."reservation_config" ADD CONSTRAINT "reservation_config_RCOrganizationId_fkey" FOREIGN KEY ("RCOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_IROrganizationId_fkey" FOREIGN KEY ("IROrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_IRDispatchOrderUId_fkey" FOREIGN KEY ("IRDispatchOrderUId") REFERENCES "business"."dispatch_order_u"("DOUId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_IRInvcaruniId_fkey" FOREIGN KEY ("IRInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."inventory_reservations" ADD CONSTRAINT "inventory_reservations_IRKardexLoteId_fkey" FOREIGN KEY ("IRKardexLoteId") REFERENCES "business"."kardex_lote"("KLId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturag" ADD CONSTRAINT "facturag_FGOrganizationId_fkey" FOREIGN KEY ("FGOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturag" ADD CONSTRAINT "facturag_FGDispatchOrderGId_fkey" FOREIGN KEY ("FGDispatchOrderGId") REFERENCES "business"."dispatch_order_g"("DOGId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturag" ADD CONSTRAINT "facturag_FGClienteId_fkey" FOREIGN KEY ("FGClienteId") REFERENCES "business"."cltemae"("CId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturag" ADD CONSTRAINT "facturag_FGVendedorId_fkey" FOREIGN KEY ("FGVendedorId") REFERENCES "business"."vendedores"("VId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturag" ADD CONSTRAINT "facturag_FGCiudadId_fkey" FOREIGN KEY ("FGCiudadId") REFERENCES "business"."ciudades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."mov_cxc" ADD CONSTRAINT "mov_cxc_MCOrganizationId_fkey" FOREIGN KEY ("MCOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."mov_cxc" ADD CONSTRAINT "mov_cxc_MCFacturaId_fkey" FOREIGN KEY ("MCFacturaId") REFERENCES "business"."facturag"("FGId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."mov_cxc" ADD CONSTRAINT "mov_cxc_MCTipoMovimientoId_fkey" FOREIGN KEY ("MCTipoMovimientoId") REFERENCES "business"."tmovkar"("TId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."banks" ADD CONSTRAINT "banks_BOrganizationId_fkey" FOREIGN KEY ("BOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."wallet_payments" ADD CONSTRAINT "wallet_payments_WPMovCXCId_fkey" FOREIGN KEY ("WPMovCXCId") REFERENCES "business"."mov_cxc"("MCId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."wallet_payments" ADD CONSTRAINT "wallet_payments_WPOrganizationId_fkey" FOREIGN KEY ("WPOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."wallet_payments" ADD CONSTRAINT "wallet_payments_WPBancoId_fkey" FOREIGN KEY ("WPBancoId") REFERENCES "business"."banks"("BId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."credit_card_payments" ADD CONSTRAINT "credit_card_payments_CCPMovCXCId_fkey" FOREIGN KEY ("CCPMovCXCId") REFERENCES "business"."mov_cxc"("MCId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."credit_card_payments" ADD CONSTRAINT "credit_card_payments_CCPOrganizationId_fkey" FOREIGN KEY ("CCPOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."credit_card_payments" ADD CONSTRAINT "credit_card_payments_CCPBancoId_fkey" FOREIGN KEY ("CCPBancoId") REFERENCES "business"."banks"("BId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."transfer_payments" ADD CONSTRAINT "transfer_payments_TPMovCXCId_fkey" FOREIGN KEY ("TPMovCXCId") REFERENCES "business"."mov_cxc"("MCId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."transfer_payments" ADD CONSTRAINT "transfer_payments_TPOrganizationId_fkey" FOREIGN KEY ("TPOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."transfer_payments" ADD CONSTRAINT "transfer_payments_TPBancoId_fkey" FOREIGN KEY ("TPBancoId") REFERENCES "business"."banks"("BId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."check_payments" ADD CONSTRAINT "check_payments_CHPMovCXCId_fkey" FOREIGN KEY ("CHPMovCXCId") REFERENCES "business"."mov_cxc"("MCId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."check_payments" ADD CONSTRAINT "check_payments_CHPOrganizationId_fkey" FOREIGN KEY ("CHPOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."check_payments" ADD CONSTRAINT "check_payments_CHPBancoId_fkey" FOREIGN KEY ("CHPBancoId") REFERENCES "business"."banks"("BId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturau" ADD CONSTRAINT "facturau_FUOrganizationId_fkey" FOREIGN KEY ("FUOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturau" ADD CONSTRAINT "facturau_FUFacturaId_fkey" FOREIGN KEY ("FUFacturaId") REFERENCES "business"."facturag"("FGId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturau" ADD CONSTRAINT "facturau_FUOriginalItemId_fkey" FOREIGN KEY ("FUOriginalItemId") REFERENCES "business"."facturau"("FUId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturau" ADD CONSTRAINT "facturau_FUInvcaruniId_fkey" FOREIGN KEY ("FUInvcaruniId") REFERENCES "business"."invcaruni"("CKId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."facturau" ADD CONSTRAINT "facturau_FUMovCXCId_fkey" FOREIGN KEY ("FUMovCXCId") REFERENCES "business"."mov_cxc"("MCId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."rclteg" ADD CONSTRAINT "rclteg_RGOrganizationId_fkey" FOREIGN KEY ("RGOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."rclteg" ADD CONSTRAINT "rclteg_RGClienteId_fkey" FOREIGN KEY ("RGClienteId") REFERENCES "business"."cltemae"("CId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."rclteg" ADD CONSTRAINT "rclteg_RGVendedorId_fkey" FOREIGN KEY ("RGVendedorId") REFERENCES "business"."vendedores"("VId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."rclteu" ADD CONSTRAINT "rclteu_RUOrganizationId_fkey" FOREIGN KEY ("RUOrganizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."rclteu" ADD CONSTRAINT "rclteu_RURemisionId_fkey" FOREIGN KEY ("RURemisionId") REFERENCES "business"."rclteg"("RGId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."periodos_cierre" ADD CONSTRAINT "periodos_cierre_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."periodos_activos" ADD CONSTRAINT "periodos_activos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
