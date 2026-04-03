import { useState } from 'react';

const useTicketDetail = () => {
  const [selected, setSelected] = useState(null);

  const openTicket  = (ticket) => setSelected(ticket);
  const closeTicket = ()       => setSelected(null);

  return { selected, openTicket, closeTicket };
};

export default useTicketDetail;
