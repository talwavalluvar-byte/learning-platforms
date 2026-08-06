
    
    

select
    lead_id as unique_field,
    count(*) as n_records

from `automobile_dw`.`stg_fact_delivery`
where lead_id is not null
group by lead_id
having count(*) > 1


