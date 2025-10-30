import { useState, useEffect } from 'react';

interface IPInfo {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  loading: boolean;
  error?: string;
}

export const useUserIP = () => {
  const [ipInfo, setIpInfo] = useState<IPInfo>({
    ip: '',
    loading: true
  });

  useEffect(() => {
    const fetchIPInfo = async () => {
      try {
        setIpInfo(prev => ({ ...prev, loading: true, error: undefined }));

        // Primeiro, tentar obter IP básico
        let ipResponse;
        try {
          ipResponse = await fetch('https://api.ipify.org?format=json');
          if (!ipResponse.ok) throw new Error('Falha ao obter IP');
        } catch (error) {
          // Fallback para outro serviço
          try {
            ipResponse = await fetch('https://httpbin.org/ip');
            if (!ipResponse.ok) throw new Error('Falha ao obter IP');
          } catch (fallbackError) {
            // Último fallback
            ipResponse = await fetch('https://jsonip.com');
            if (!ipResponse.ok) throw new Error('Falha ao obter IP');
          }
        }

        const ipData = await ipResponse.json();
        const userIP = ipData.ip || ipData.origin || ipData.ip;

        if (!userIP) {
          throw new Error('IP não encontrado na resposta');
        }

        // Tentar obter informações detalhadas do IP
        try {
          const detailResponse = await fetch(`https://ipapi.co/${userIP}/json/`);
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            
            setIpInfo({
              ip: userIP,
              country: detailData.country_name,
              region: detailData.region,
              city: detailData.city,
              isp: detailData.org,
              loading: false
            });
          } else {
            // Se não conseguir detalhes, usar apenas o IP
            setIpInfo({
              ip: userIP,
              loading: false
            });
          }
        } catch (detailError) {
          console.warn('Não foi possível obter detalhes do IP:', detailError);
          setIpInfo({
            ip: userIP,
            loading: false
          });
        }

      } catch (error) {
        console.error('Erro ao obter informações de IP:', error);
        setIpInfo({
          ip: 'Não disponível',
          loading: false,
          error: 'Não foi possível obter o IP'
        });
      }
    };

    fetchIPInfo();
  }, []);

  return ipInfo;
};
